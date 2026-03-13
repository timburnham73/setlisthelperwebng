export interface EntitlementLimit {
  maxSongs: number | null;
  maxSetlists: number | null;
  maxBands: number | null;
  maxMembers: number;
}

export const ENTITLEMENT_LIMITS: Record<string, EntitlementLimit> = {
  'free':                       { maxSongs: 25,   maxSetlists: 5,    maxBands: 1,    maxMembers: 1 },
  'solo':                       { maxSongs: null,  maxSetlists: null, maxBands: 2,    maxMembers: 2 },
  'solo-free-trial':            { maxSongs: null,  maxSetlists: null, maxBands: 2,    maxMembers: 2 },
  'band-small':                 { maxSongs: null,  maxSetlists: null, maxBands: 5,    maxMembers: 5 },
  'band-small-free-trial':      { maxSongs: null,  maxSetlists: null, maxBands: 5,    maxMembers: 5 },
  'band-medium':                { maxSongs: null,  maxSetlists: null, maxBands: 10,   maxMembers: 20 },
  'band-medium-free-trial':     { maxSongs: null,  maxSetlists: null, maxBands: 10,   maxMembers: 20 },
  'band-large':                 { maxSongs: null,  maxSetlists: null, maxBands: null,  maxMembers: 100 },
  'band-large-free-trial':      { maxSongs: null,  maxSetlists: null, maxBands: null,  maxMembers: 100 },
  'band-extra-large':           { maxSongs: null,  maxSetlists: null, maxBands: null,  maxMembers: 500 },
  'band-extra-large-free-trial':{ maxSongs: null,  maxSetlists: null, maxBands: null,  maxMembers: 500 },
};

export function getEntitlementLimits(entitlementLevel: string | undefined): EntitlementLimit {
  return ENTITLEMENT_LIMITS[entitlementLevel ?? 'free'] ?? ENTITLEMENT_LIMITS['free'];
}
