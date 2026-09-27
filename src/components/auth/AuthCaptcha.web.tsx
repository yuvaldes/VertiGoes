import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useT } from '../../i18n';
import { TURNSTILE_SITE_KEY } from '../../lib/authConfig';
import { color, font } from '../../theme/tokens';
import type { AuthCaptchaProps } from './AuthCaptcha';

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }
let loading: Promise<Turnstile> | undefined;
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const timeout = window.setTimeout(() => fail(), 15000);
    const fail = () => {
      clearTimeout(timeout);
      script.onload = script.onerror = null;
      script.remove();
      reject(new Error('Challenge unavailable'));
    };
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile); else fail();
    };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}

export function AuthCaptcha({ onToken, version }: AuthCaptchaProps) {
  const t = useT();
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !container.current) return;
    let cancelled = false;
    let widget: string | undefined;
    callback.current(undefined);
    setFailed(false);
    const clear = () => { if (!cancelled) callback.current(undefined); };
    const error = () => { clear(); if (!cancelled) setFailed(true); };
    void loadTurnstile().then(api => {
      if (cancelled || !container.current) return;
      widget = api.render(container.current, {
        sitekey: TURNSTILE_SITE_KEY, size: 'flexible', theme: 'light',
        callback: (token: string) => { if (!cancelled) { setFailed(false); callback.current(token); } },
        'expired-callback': clear, 'timeout-callback': clear, 'error-callback': error,
      });
    }).catch(error);
    return () => {
      cancelled = true;
      if (widget !== undefined) window.turnstile?.remove(widget);
    };
  }, [version, retry]);
  if (!TURNSTILE_SITE_KEY) return null;
  return <View style={{ gap: 8 }}>
    <div ref={container} aria-label={t('auth.captcha.label')} />
    {failed && <>
      <Text accessibilityRole="alert" style={{ color: color.error500, fontFamily: font.body }}>{t('auth.captcha.failed')}</Text>
      <Pressable onPress={() => setRetry(value => value + 1)} accessibilityRole="button">
        <Text style={{ color: color.brand600, fontFamily: font.bodySemiBold }}>{t('auth.status.retry')}</Text>
      </Pressable>
    </>}
  </View>;
}
