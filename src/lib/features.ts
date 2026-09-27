// Mock checkout is opt-in, development-only, and never a source of real entitlements.
// A production payment integration must use verified server-side billing/webhooks.
export const ENABLE_DEMO_BILLING = __DEV__ &&
  process.env.EXPO_PUBLIC_ENABLE_DEMO_BILLING === 'true';
