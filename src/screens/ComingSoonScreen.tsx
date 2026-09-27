import { LivAvatar } from '../components/liv/LivAvatar';
import { useT } from '../i18n';
import { featureCopy, type PendingFeature } from '../lib/featureAvailability';
import { PlaceholderScreen } from './PlaceholderScreen';

export function ComingSoonScreen({ feature, onBack }: { feature: PendingFeature; onBack?: () => void }) {
  const t = useT();
  const copy = featureCopy[feature];
  return <PlaceholderScreen title={t(copy.title)} note={t(copy.note)} onBack={onBack}
    illustration={feature === 'liv' ? <LivAvatar size={96} /> : undefined} />;
}
