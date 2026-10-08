import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
export const APP_VERSION = '1.0.0';
const REQUEST_TIMEOUT_MS = 20_000;

/** Never leave an auth or persistence control stuck if a network request stops responding. */
const fetchWithTimeout: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const upstream = init.signal;
  const abortFromUpstream = () => controller.abort(upstream?.reason);
  if (upstream?.aborted) abortFromUpstream();
  else upstream?.addEventListener('abort', abortFromUpstream, { once: true });
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    upstream?.removeEventListener('abort', abortFromUpstream);
  }
};

// Missing configuration must not crash guest browsing or impersonate a successful login.
// Never put a service-role/secret key in an EXPO_PUBLIC variable.
export const supabase = url && key
  ? createClient(url, key, {
      global: { fetch: fetchWithTimeout, headers: { 'X-App-Version': APP_VERSION } },
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
