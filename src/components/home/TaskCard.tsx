import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TaskSwoosh, swooshSize, type SwooshKind } from '../../assets/TaskSwoosh';
import { useDirection, useDisplayFont, useT } from '../../i18n';
import { color, font, shadow } from '../../theme/tokens';
import { Ring } from '../Ring';

/** The three Home tasks, each with its own hue ramp. */
export type TaskTone = 'feeling' | 'sleep' | 'exercises';

const TONES: Record<TaskTone, { from: string; to: string; border: string; eyebrow: string; title: string }> = {
  feeling: {
    from: color.turquoise50,
    to: color.turquoise25,
    border: color.turquoise100,
    eyebrow: color.turquoise400,
    title: color.turquoise600,
  },
  sleep: {
    from: color.purple100,
    to: color.purple25,
    border: color.purple200,
    eyebrow: color.purple400,
    title: color.purple600,
  },
  exercises: {
    from: color.brand100,
    to: color.brand25,
    border: color.brand100,
    eyebrow: color.brand400,
    title: color.brand600,
  },
};

/** The stroke colour each card's decoration uses while the task is still open. */
const SWOOSH_TINT: Record<TaskTone, string> = {
  feeling: color.turquoise100,
  sleep: color.purple200,
  exercises: color.brand200,
};

type Props = {
  tone: TaskTone;
  /** Shown in place of the question once the task has been answered. */
  title: string;
  completed: boolean;
  onPress?: () => void;
};

/**
 * One of the three cards stacked under Home's streak row.
 *
 * Answered cards flatten to a grey surface and swap the eyebrow for a green check, keeping
 * the same decoration in `gray/100` — the design exports a separate greyed SVG per card, but
 * the geometry is identical so only the stroke changes.
 */
export function TaskCard({ tone, title, completed, onPress }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const palette = TONES[tone];

  const body = (
    <>
      {/* An answered card is done with: it goes grey and its stroke stops sweeping. */}
      <CardSwoosh
        kind={tone}
        color={completed ? color.gray100 : SWOOSH_TINT[tone]}
        animate={!completed}
      />

      {completed ? (
        <View style={styles.doneEyebrow}>
          <CheckCircle size={12} color={color.success500} />
          <Text style={styles.doneEyebrowLabel}>{t('ui.task.completed')}</Text>
        </View>
      ) : (
        <Text style={[styles.eyebrow, { color: palette.eyebrow }]}>
          {t('ui.task.notCompleted')}
        </Text>
      )}

      <Text style={[styles.title, displayFont, { color: completed ? color.gray400 : palette.title }]}>
        {title}
      </Text>

      <Ring radius={16} color={completed ? color.gray100 : palette.border} />
    </>
  );

  // An answered task is locked, so it stops being a button rather than tapping to nothing.
  if (completed) {
    return <View style={[styles.card, styles.cardDone]}>{body}</View>;
  }

  const gradient = (
    <LinearGradient
      colors={[palette.from, palette.to]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.card}
    >
      {body}
    </LinearGradient>
  );

  /**
   * Android builds an elevation shadow from the view's background outline, so a transparent
   * wrapper casts nothing. Painting it the gradient's own first stop is invisible — the card
   * covers it exactly — but gives Android something to cast from.
   */
  const shadowStyle = [styles.shadow, { backgroundColor: palette.from }];

  if (!onPress) {
    return <View style={shadowStyle}>{gradient}</View>;
  }

  return (
    <Pressable
      style={shadowStyle}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {gradient}
    </Pressable>
  );
}

/**
 * Placement is read straight off the design, with the difference that Figma sizes each layer
 * to the path geometry and bleeds the 10.4px stroke outside it. `swooshSize` returns the
 * stroke-expanded box, so every `end`/`top` here is the design's value minus that bleed.
 *
 * The two frames nudge these by up to 1px between the open and completed states; one set is
 * used for both, since the decoration is clipped and out of focus either way.
 *
 * `end` rather than `right`: the eyebrow and title are ordinary flow content, so under RTL
 * they move to the right edge and the decoration has to vacate it or land on top of them.
 * The anchor flipping is not enough on its own, though — an SVG path is never mirrored by
 * either platform, so the curve would sweep against the layout. Hence `scaleX` on the
 * wrapper. Mirroring on the outside also reverses the exercises tilt for free, because
 * `scaleX(-1) · rotate(θ)` is `rotate(-θ) · scaleX(-1)`; negating the angle as well would
 * put it back.
 */
function CardSwoosh({
  kind,
  color: stroke,
  animate,
}: {
  kind: SwooshKind;
  color: string;
  animate: boolean;
}) {
  const { isRTL } = useDirection();
  const { width, height } = swooshSize(kind);
  const mirror = isRTL ? styles.mirrored : null;

  if (kind === 'feeling') {
    // Anchored to the card's top edge rather than centred.
    return (
      <View style={[styles.swooshTop, mirror, { end: 7.39, top: -13.74, width, height }]}>
        <TaskSwoosh kind={kind} color={stroke} animate={animate} />
      </View>
    );
  }

  if (kind === 'sleep') {
    return (
      <View style={[styles.swooshCentred, mirror, { end: -98.77, width }]}>
        <View style={{ transform: [{ translateY: 39.73 }] }}>
          <TaskSwoosh kind={kind} color={stroke} animate={animate} />
        </View>
      </View>
    );
  }

  // The exercises stroke is rotated inside a wider bounding box, so it needs the extra frame.
  return (
    <View style={[styles.swooshCentred, mirror, { end: -10.65, width: 145.137 }]}>
      <View style={{ transform: [{ translateY: 3.91 }, { rotate: '28.34deg' }] }}>
        <TaskSwoosh kind={kind} color={stroke} animate={animate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * The shadow sits on an outer wrapper: the card itself clips its decoration with
   * `overflow: hidden`, which would clip the shadow away too.
   */
  shadow: {
    width: '100%',
    borderRadius: 16,
    ...shadow.md,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 20,
    gap: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  /** Completed cards are flat and shadowless in the design. */
  cardDone: {
    backgroundColor: color.gray200,
  },
  eyebrow: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
  },
  doneEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneEyebrowLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    color: color.success500,
  },
  title: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
  },
  swooshTop: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  /** See CardSwoosh: the anchor flips itself, the path has to be told to. */
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  /** Full-height so the stroke centres on the card whatever its content height. */
  swooshCentred: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});
