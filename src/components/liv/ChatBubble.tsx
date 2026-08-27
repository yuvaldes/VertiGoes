import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '../../data/livChat';
import { color, font } from '../../theme/tokens';
import { Ring } from '../Ring';

/**
 * A turn in the conversation.
 *
 * Per the mock the two sides are asymmetric rather than mirrored: what the *user* said is
 * boxed — a full-width, tinted, outlined field, echoing the composer it was typed into —
 * while Liv's reply is plain prose with no container at all. That reads as a transcript
 * rather than as two people texting, which suits replies long enough to be paragraphs.
 *
 * Note this is the opposite of the usual messaging convention, where the sender's own
 * messages get the filled bubble.
 */
export function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'liv') {
    return <Text style={styles.livText}>{message.text}</Text>;
  }

  return (
    <View style={styles.userBox}>
      <Text style={styles.userText}>{message.text}</Text>
      <Ring radius={12} color={color.brand200} />
    </View>
  );
}

const styles = StyleSheet.create({
  /** Full width, so it lines up with the composer directly below it. */
  userBox: {
    alignSelf: 'stretch',
    backgroundColor: color.brand50,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  userText: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray900,
  },
  /** No container: Liv is the page speaking, not a participant in a thread. */
  livText: {
    alignSelf: 'stretch',
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.black,
  },
});
