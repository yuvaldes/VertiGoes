import type { SupabaseClient } from '@supabase/supabase-js';

import type { DayRecord } from '../data/dayRecords';

export type DayRecordsSyncStatus = 'loading' | 'saving' | 'saved' | 'error';
export type DayRecordsSnapshot = {
  records: Map<string, DayRecord>;
  syncStatus: DayRecordsSyncStatus;
};
type Mutation = (record: DayRecord) => DayRecord;

export type DayRecordsTransport = {
  load: (signal: AbortSignal) => Promise<Map<string, DayRecord>>;
  save: (record: DayRecord, signal: AbortSignal) => Promise<void>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonnegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** JSONB has no generated type: reject malformed health history instead of inventing data. */
export function parseDayRecord(date: string, value: unknown): DayRecord {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) || !isObject(value) || value.date !== date ||
    !isNonnegativeNumber(value.episodes) || !Number.isInteger(value.episodes) ||
    typeof value.emergencyCall !== 'boolean' ||
    !(value.sleepHours === null || isNonnegativeNumber(value.sleepHours)) ||
    !(value.feeling === null || value.feeling === 'good' || value.feeling === 'bad') ||
    !(value.exercisePlan === 'once' || value.exercisePlan === 'thrice') ||
    !isObject(value.exercises) ||
    !Object.entries(value.exercises).every(([slot, progress]) =>
      ['morning', 'midday', 'evening'].includes(slot) && isObject(progress) &&
      isNonnegativeNumber(progress.done) && isNonnegativeNumber(progress.total)) ||
    !(value.liv === null || (isObject(value.liv) && typeof value.liv.summary === 'string')) ||
    !(value.inAppHelp === null || (isObject(value.inAppHelp) &&
      Array.isArray(value.inAppHelp.answers) && value.inAppHelp.answers.every((answer: unknown) =>
        isObject(answer) && typeof answer.questionId === 'string' &&
        isNonnegativeNumber(answer.optionIndex) && Number.isInteger(answer.optionIndex))))
  ) {
    throw new Error('Invalid day record returned by the server.');
  }
  return value as DayRecord;
}

// Includes requests from a previous provider instance for the same account. An already
// dispatched write is allowed to finish before the next write starts, even after sign-out.
const writeTails = new Map<string, Promise<void>>();

function serializeWrite(userId: string, write: () => Promise<void>): Promise<void> {
  const result = (writeTails.get(userId) ?? Promise.resolve()).then(write);
  const settled = result.then(() => {}, () => {});
  writeTails.set(userId, settled);
  void settled.then(() => {
    if (writeTails.get(userId) === settled) writeTails.delete(userId);
  });
  return result;
}

export function createDayRecordsTransport(
  client: SupabaseClient | null,
  userId: string,
): DayRecordsTransport {
  async function authorize(signal: AbortSignal) {
    if (!client || signal.aborted) throw new Error('Day record sync is unavailable.');
    const { data, error } = await client.auth.getSession();
    if (error || signal.aborted || data.session?.user.id !== userId) {
      throw new Error('Day record account changed.');
    }
    // Pin the request to the checked identity, even if the shared client's session changes
    // before fetch. RLS remains the authority for both reads and writes.
    return { db: client, authorization: `Bearer ${data.session.access_token}` };
  }

  return {
    async load(signal) {
      // Returning to the same account must read after its previous dispatched save settles.
      await writeTails.get(userId);
      const records = new Map<string, DayRecord>();
      let after: string | undefined;
      // Keyset pagination also handles servers configured with a smaller row limit.
      for (;;) {
        const { db, authorization } = await authorize(signal);
        let query = db.from('day_records').select('user_id, record_date, record')
          .eq('user_id', userId).order('record_date', { ascending: true }).limit(500);
        if (after) query = query.gt('record_date', after);
        const { data, error } = await query.setHeader('Authorization', authorization)
          .abortSignal(signal);
        if (error) throw error;
        if (signal.aborted || !data) throw new Error('Day record load was interrupted.');
        if (data.length === 0) return records;
        for (const row of data) {
          if (row.user_id !== userId || typeof row.record_date !== 'string' ||
              (after !== undefined && row.record_date <= after)) {
            throw new Error('Invalid day record owner or date.');
          }
          records.set(row.record_date, parseDayRecord(row.record_date, row.record));
          after = row.record_date;
        }
      }
    },
    save: (record, signal) => serializeWrite(userId, async () => {
      const { db, authorization } = await authorize(signal);
      const { error } = await db.from('day_records').upsert({
        user_id: userId,
        record_date: record.date,
        record,
      }, { onConflict: 'user_id,record_date' }).setHeader('Authorization', authorization);
      // updated_at is owned by the DB trigger. Do not cancel a dispatched write: awaiting
      // its result keeps later snapshots from overtaking it. Its UI result can be ignored.
      if (error) throw error;
    }),
  };
}

/**
 * One store per auth identity. Pending writes are deliberately memory-only: retry works
 * during this provider's lifetime, but unsaved changes do not survive reload/sign-out.
 */
export function createDayRecordsStore({
  initialRecords,
  emptyRecord,
  transport,
  readOnly = false,
}: {
  initialRecords: Map<string, DayRecord>;
  emptyRecord: (date: string) => DayRecord;
  transport: DayRecordsTransport | null;
  readOnly?: boolean;
}) {
  let snapshot: DayRecordsSnapshot = {
    records: initialRecords,
    syncStatus: transport || readOnly ? 'loading' : 'saved',
  };
  const listeners = new Set<() => void>();
  const mutations = new Map<string, Mutation[]>();
  const dirty = new Map<string, DayRecord>();
  let loaded = !transport;
  let enabled = true;
  let running = false;
  let generation = 0;
  let controller = new AbortController();

  function publish(records: Map<string, DayRecord>, syncStatus: DayRecordsSyncStatus) {
    snapshot = { records, syncStatus };
    listeners.forEach((listener) => listener());
  }

  async function drain() {
    if (!transport || !enabled || running || snapshot.syncStatus === 'error') return;
    running = true;
    const ownGeneration = generation;
    const signal = controller.signal;
    const isCurrent = () => enabled && generation === ownGeneration;
    try {
      if (!loaded) {
        const records = await transport.load(signal);
        if (!isCurrent()) return;
        // Apply intent to the loaded base, preserving untouched fields and increments.
        // Nothing is uploaded until the initial read succeeds.
        for (const [date, edits] of mutations) {
          const record = edits.reduce((base, edit) => edit(base), records.get(date) ?? emptyRecord(date));
          records.set(date, record);
          dirty.set(date, record);
        }
        mutations.clear();
        loaded = true;
        publish(new Map([...records].sort(([a], [b]) => a.localeCompare(b))),
          dirty.size ? 'saving' : 'saved');
      }
      while (isCurrent() && dirty.size) {
        const [date, record] = dirty.entries().next().value!;
        await transport.save(record, signal);
        if (!isCurrent()) return;
        // An edit during the request replaces this entry; only acknowledge what was sent.
        if (dirty.get(date) === record) dirty.delete(date);
      }
      if (isCurrent()) publish(snapshot.records, 'saved');
    } catch {
      // Keep pending edits and expose failure. New edits cannot turn a failed save green.
      if (isCurrent()) publish(snapshot.records, 'error');
    } finally {
      running = false;
      // A Strict Mode restart/reset may have happened while an old request was settling.
      if (enabled && generation !== ownGeneration) void drain();
    }
  }

  return {
    getSnapshot: () => snapshot,
    getRecord: (date: string) => enabled ? snapshot.records.get(date) : undefined,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      if (!enabled) {
        enabled = true;
        controller = new AbortController();
      }
      void drain();
    },
    stop() {
      enabled = false;
      generation += 1;
      controller.abort();
    },
    update(date: string, mutate: Mutation) {
      if (!enabled || readOnly) return;
      const record = mutate(snapshot.records.get(date) ?? emptyRecord(date));
      const records = new Map(snapshot.records);
      records.set(date, record);
      if (transport) {
        if (loaded) dirty.set(date, record);
        else mutations.set(date, [...(mutations.get(date) ?? []), mutate]);
      }
      publish(records, snapshot.syncStatus === 'error' ? 'error' :
        transport ? (loaded ? 'saving' : 'loading') : 'saved');
      void drain();
    },
    retrySync() {
      if (!enabled || !transport) return;
      publish(snapshot.records, loaded ? (dirty.size ? 'saving' : 'saved') : 'loading');
      void drain();
    },
    reset(records: Map<string, DayRecord>) {
      generation += 1;
      controller.abort();
      controller = new AbortController();
      mutations.clear();
      dirty.clear();
      loaded = !transport;
      publish(transport || readOnly ? new Map() : records,
        transport || readOnly ? 'loading' : 'saved');
      void drain();
    },
  };
}
