import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
export const APP_VERSION = '1.0.0';

// Missing configuration must not crash guest browsing or impersonate a successful login.
// Never put a service-role/secret key in an EXPO_PUBLIC variable.
export const supabase = url && key
  ? createClient(url, key, {
      global: { headers: { 'X-App-Version': APP_VERSION } },
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
