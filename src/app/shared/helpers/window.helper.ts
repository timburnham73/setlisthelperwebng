import { InjectionToken, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Self-providing token — server returns null, browser returns window
export const WINDOW = new InjectionToken<Window | null>('WindowToken', {
  providedIn: 'root',
  factory: () => (isPlatformBrowser(inject(PLATFORM_ID)) ? window : null),
});

// Guarded helper (kept for any legacy callers)
export function _window(): Window | null {
  return typeof window !== 'undefined' ? window : null;
}

// Kept for backwards-compat with SharedModule consumers of WindowRef
export abstract class WindowRef {
  get nativeWindow(): Window | null {
    throw new Error('Not implemented.');
  }
}

@Injectable({ providedIn: 'root' })
export class BrowserWindowRef extends WindowRef {
  override get nativeWindow(): Window | null {
    return typeof window !== 'undefined' ? window : null;
  }
}

// WINDOW_PROVIDERS kept as an EMPTY array — WINDOW and BrowserWindowRef both self-provide
// via `providedIn: 'root'`. Leaving the constant prevents breaking imports in SharedModule.
export const WINDOW_PROVIDERS: any[] = [];
