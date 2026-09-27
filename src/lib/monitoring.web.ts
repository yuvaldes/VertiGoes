import * as Sentry from '@sentry/browser';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';
const environment = process.env.EXPO_PUBLIC_APP_ENV?.trim() || 'unknown';

function withoutQueryOrFragment(value: string | undefined) {
  if (!value) return value;
  try {
    const url = new URL(value, window.location.origin);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

/**
 * PWA crash reporting only. No replay, performance tracing, account identity, request bodies,
 * headers, URL parameters, or breadcrumb data are sent because those can contain auth tokens
 * or health information.
 */
export function initializeMonitoring() {
  if (!dsn || Sentry.isInitialized()) return;
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: 0,
    maxBreadcrumbs: 20,
    beforeSend(event) {
      event.user = undefined;
      if (event.request) {
        event.request = {
          method: event.request.method,
          url: withoutQueryOrFragment(event.request.url),
        };
      }
      event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({
        category: breadcrumb.category,
        level: breadcrumb.level,
        message: breadcrumb.message,
        timestamp: breadcrumb.timestamp,
        type: breadcrumb.type,
      }));
      return event;
    },
  });
}
