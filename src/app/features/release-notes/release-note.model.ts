export interface ReleaseNote {
  slug: string;
  app: 'Android' | 'iOS' | 'Web';
  version: string;
  title: string;
  metaDescription: string;
  date: string;
  summary: string;
}
