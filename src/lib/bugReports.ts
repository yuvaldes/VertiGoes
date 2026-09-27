import { supabase } from './supabase';

export const BUG_REPORT_MAX_LENGTH = 3000;

export type BugReportInput = {
  id: string;
  description: string;
  platform: string;
  locale: 'en' | 'he';
  appVersion: string;
};

export async function submitBugReport(input: BugReportInput): Promise<void> {
  const description = input.description.trim();
  if (!description || description.length > BUG_REPORT_MAX_LENGTH) {
    throw new Error('Invalid report length');
  }
  if (!supabase) throw new Error('Reports unavailable');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sign in required');

  const { error } = await supabase.from('bug_reports').insert({
    id: input.id,
    user_id: user.id,
    description,
    platform: input.platform,
    locale: input.locale,
    app_version: input.appVersion,
  });

  // A retry after a lost response may already have been saved. Confirm ownership and
  // content before treating a duplicate ID as success; RLS protects this read too.
  if (error?.code === '23505') {
    const { data, error: readError } = await supabase.from('bug_reports')
      .select('id, description').eq('id', input.id).eq('user_id', user.id).maybeSingle();
    if (!readError && data?.description === description) return;
  }
  if (error) throw error;
}
