import type { TKey } from '../i18n';

// Release switches, not authorization. Keep backend RLS/permissions independent.
// Enable a feature only after its real content/service is tested in staging.
export const featureAvailability = {
  liv: false,
  professionals: false,
  exercises: false,
  meditation: false,
  playlists: false,
  community: false,
  symptoms: false,
  subscription: false,
  guidedHelp: true,
  emergencyContact: true,
  diagnosis: false,
  googleAuth: true,
} satisfies Record<string, boolean>;

export type PendingFeature = keyof typeof featureAvailability;
export function isFeatureReady(feature: PendingFeature): boolean {
  return featureAvailability[feature];
}

export const featureCopy: Record<PendingFeature, { title: TKey; note: TKey }> = {
  liv: { title: 'browse.liv.title', note: 'browse.pending.liv' },
  professionals: { title: 'browse.professionals.title', note: 'browse.pending.professionals' },
  exercises: { title: 'browse.library.title', note: 'browse.pending.exercises' },
  meditation: { title: 'browse.meditation.title', note: 'browse.pending.meditation' },
  playlists: { title: 'browse.menu.rowPlaylists', note: 'browse.menu.playlistsNote' },
  community: { title: 'browse.menu.rowCommunity', note: 'browse.menu.communityNote' },
  symptoms: { title: 'browse.menu.rowSymptoms', note: 'browse.menu.symptomsNote' },
  subscription: { title: 'browse.menu.rowSubscription', note: 'browse.pending.subscription' },
  guidedHelp: { title: 'common.emergency.helpTitle', note: 'browse.pending.guidedHelp' },
  emergencyContact: { title: 'common.emergency.callTitle', note: 'browse.pending.emergencyContact' },
  diagnosis: { title: 'flows.diagnosis.title', note: 'browse.pending.diagnosis' },
  googleAuth: { title: 'auth.sheet.google', note: 'browse.pending.socialAuth' },
};

// Guard every destination, including detail/edit screens, before mounting demo code.
const routeFeatures: Record<string, PendingFeature> = {
  liv: 'liv', professionals: 'professionals', professional: 'professionals',
  exerciseVideos: 'exercises', exerciseLibrary: 'exercises', editExercises: 'exercises',
  meditationDrills: 'meditation', subscription: 'subscription', checkout: 'subscription',
  helpFlow: 'guidedHelp',
};
export function pendingFeatureForRoute(route: string): PendingFeature | null {
  if (!Object.hasOwn(routeFeatures, route)) return null;
  const feature = routeFeatures[route];
  return feature && !isFeatureReady(feature) ? feature : null;
}
