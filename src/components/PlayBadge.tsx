import Svg, { Path, Rect } from 'react-native-svg';

/**
 * The play affordance overlaid on an exercise thumbnail.
 *
 * Traced from the Figma export of node 7338:214872 "Play": a 24x24 disc at black/50%
 * with a Gray/50 triangle. Earlier this was hand-composed as a smaller disc, which was
 * wrong — the disc fills the full 24px box.
 *
 * The triangle stays pointing right under RTL. It is a playback control, not a "forward"
 * affordance, and both Apple's and Material's guidance leave transport controls unmirrored.
 */
export function PlayBadge({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width={24} height={24} rx={12} fill="black" fillOpacity={0.5} />
      <Path
        d="M17.402 12C17.4023 12.1393 17.3666 12.2763 17.2983 12.3977C17.23 12.5191 17.1314 12.6208 17.0122 12.6929L9.62311 17.2131C9.49853 17.2894 9.35585 17.331 9.20979 17.3337C9.06374 17.3364 8.91961 17.3001 8.7923 17.2285C8.66619 17.158 8.56114 17.0551 8.48795 16.9306C8.41477 16.806 8.37608 16.6642 8.37586 16.5197V7.48028C8.37608 7.3358 8.41477 7.19399 8.48795 7.06942C8.56114 6.94486 8.66619 6.84203 8.7923 6.77153C8.91961 6.69991 9.06374 6.66357 9.20979 6.66628C9.35585 6.66898 9.49853 6.71063 9.62311 6.78691L17.0122 11.3071C17.1314 11.3792 17.23 11.4809 17.2983 11.6023C17.3666 11.7237 17.4023 11.8607 17.402 12Z"
        fill="#FAFAFA"
      />
    </Svg>
  );
}
