import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { ActionCard } from '../components/liv/ActionCard';
import { LISTEN_DELAY_MS, nextCannedPhrase } from '../components/liv/cannedPhrases';
import { ChatBubble } from '../components/liv/ChatBubble';
import { Composer } from '../components/liv/Composer';
import { LivAvatar } from '../components/liv/LivAvatar';
import { PromptChips } from '../components/liv/PromptChips';
import { TypingIndicator } from '../components/liv/TypingIndicator';
import { VoiceListening } from '../components/liv/VoiceListening';
import { VoiceModeBar } from '../components/liv/VoiceModeBar';
import { user, type TabKey } from '../data/home';
import { useDisplayFont, useT } from '../i18n';
import { useLivChat } from '../state/LivChatContext';
import { color, font, frame } from '../theme/tokens';

type Props = {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  /** Liv's `startHelp` action opens the real flow; navigation is the shell's job, not hers. */
  onStartHelpFlow: () => void;
};

/**
 * The Liv conversation — a tab root rather than a pushed screen, since the tab already
 * exists in the bottom bar.
 *
 * No Emergency drawer here: the composer needs that space, and Liv is herself the in-app
 * help channel, offering the same flow as an action when the conversation calls for it.
 */
export function LivScreen({ activeTab, onChangeTab, onStartHelpFlow }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const { todayMessages, isThinking, send, acceptAction } = useLivChat();

  const [draft, setDraft] = useState('');
  /**
   * Two ways in, because the composer offers two: the mic dictates into the field, the
   * waveform button is hands-free and sends what it hears.
   */
  const [listening, setListening] = useState<'dictate' | 'voice' | null>(null);
  /** Voice mode's own pause, distinct from `listening` — closing the bar always clears both. */
  const [voiceMuted, setVoiceMuted] = useState(false);
  /** Actions the user waved off, so the card can disappear without mutating the thread. */
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = useCallback(() => {
    // A frame's grace so the new bubble is laid out before we scroll past it.
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const submit = useCallback(
    (text: string) => {
      if (!text.trim() || isThinking) return;
      send(text);
      setDraft('');
      scrollToEnd();
    },
    [isThinking, scrollToEnd, send],
  );

  const exitVoiceMode = useCallback(() => {
    setListening(null);
    setVoiceMuted(false);
  }, []);

  const voiceListening = listening === 'voice' && !voiceMuted && !isThinking;

  /**
   * Hands-free voice mode keeps "listening" turn after turn until muted or closed, unlike
   * dictation's one-shot `VoiceListening` — so the loop lives here, re-arming itself whenever
   * `voiceListening` flips back to true (a reply finishes, or the user unmutes).
   */
  useEffect(() => {
    if (!voiceListening) return;
    const timer = setTimeout(() => submit(nextCannedPhrase()), LISTEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [voiceListening, submit]);

  const isEmpty = todayMessages.length === 0;

  return (
    <View style={styles.body}>
      <View style={styles.headerGutter}>
        <AppHeader>
          {/*
            Only once the conversation has started. The empty state already introduces her
            with the large avatar and a greeting, so the header title and small avatar would
            just be her name and face twice on one screen.
          */}
          {!isEmpty && (
            <View style={styles.titleRow}>
              <Text style={[styles.title, displayFont]}>{t('browse.liv.title')}</Text>
              <LivAvatar />
            </View>
          )}
        </AppHeader>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
          // Without this, the first tap while the keyboard is open only dismisses it.
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        >
          {isEmpty ? (
            <PromptChips firstName={user.firstName} onPick={submit} />
          ) : (
            todayMessages.map((message) => (
              <View key={message.id} style={styles.turn}>
                <ChatBubble message={message} />
                {message.action && !dismissed.has(message.id) && (
                  <ActionCard
                    action={message.action}
                    taken={Boolean(message.actionTaken)}
                    onAccept={() => {
                      acceptAction(message.id);
                      // Opening the flow is navigation, so it stays out of the chat state.
                      if (message.action?.kind === 'startHelp') onStartHelpFlow();
                      scrollToEnd();
                    }}
                    onDismiss={() =>
                      setDismissed((current) => new Set(current).add(message.id))
                    }
                  />
                )}
              </View>
            ))
          )}

          {isThinking && <TypingIndicator />}
        </ScrollView>

        {listening === 'voice' ? (
          <VoiceModeBar
            active={voiceListening}
            muted={voiceMuted}
            onToggleMute={() => setVoiceMuted((current) => !current)}
            onClose={exitVoiceMode}
            statusText={
              isThinking
                ? t('browse.liv.voiceReplying')
                : voiceMuted
                  ? t('browse.liv.voiceMuted')
                  : t('browse.liv.voiceListening')
            }
          />
        ) : listening === 'dictate' ? (
          <VoiceListening
            onHeard={(text) => {
              setListening(null);
              // Dictation: lands in the composer so a misheard phrase stays editable.
              setDraft(text);
            }}
            onCancel={() => setListening(null)}
          />
        ) : (
          <Composer
            value={draft}
            onChangeText={setDraft}
            onSend={() => submit(draft)}
            onDictate={() => setListening('dictate')}
            onVoiceMode={() => setListening('voice')}
            disabled={isThinking}
          />
        )}
      </KeyboardAvoidingView>

      <BottomBarSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.gray50,
  },
  flex: {
    flex: 1,
  },
  headerGutter: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 8,
  },
  /** The avatar is taller than the title, so the row grows to fit it. */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 32,
    color: color.black,
  },
  thread: {
    paddingHorizontal: frame.gutter,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  /** Groups a bubble with the action card that belongs to it. */
  turn: {
    gap: 6,
  },
});
