import { ReleaseNote } from './release-note.model';

// Newest first — the landing page renders this list as-is.
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    slug: 'band-central-android-2-1-1',
    app: 'Android',
    version: '2.1.1',
    title: 'Band Central for Android 2.1.1',
    metaDescription:
      'Band Central for Android 2.1.1 release notes: A-Z song scroller, swipe between songs in lyrics, file-type picker on import, Detect Pedals screen, faster lists, and a stack of crash and stability fixes.',
    date: 'April 2026',
    summary:
      'Faster lists with live updates, A-Z scroller on Songs, swipe between songs in the lyric viewer, file-type filtering on import, a Detect Pedals settings screen, plus a long list of crash and stability fixes.'
  }
];
