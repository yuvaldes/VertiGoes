import { useCallback, useState } from 'react';
import { CAPTCHA_REQUIRED } from '../../lib/authConfig';

export function useAuthChallenge() {
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const [challengeVersion, setChallengeVersion] = useState(0);
  const resetChallenge = useCallback(() => {
    setCaptchaToken(undefined);
    setChallengeVersion(value => value + 1);
  }, []);
  return { captchaToken, setCaptchaToken, challengeVersion, resetChallenge,
    challengeReady: !CAPTCHA_REQUIRED || Boolean(captchaToken) };
}
