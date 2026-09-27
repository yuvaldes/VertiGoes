import { Text } from 'react-native';
import { useT } from '../../i18n';
import { CAPTCHA_REQUIRED } from '../../lib/authConfig';
import { color } from '../../theme/tokens';

export type AuthCaptchaProps = { onToken: (token: string | undefined) => void; version: number };

// Native needs a separately integrated challenge. Never bypass a configured CAPTCHA.
export function AuthCaptcha(_props: AuthCaptchaProps) {
  const t = useT();
  return CAPTCHA_REQUIRED ?
    <Text style={{ color: color.error500 }} accessibilityRole="alert">{t('auth.captcha.useWeb')}</Text> : null;
}
