import { SafeHtml } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  it('create an instance', () => {
    // Pipe instantiation requires a DomSanitizer — this is a smoke test only.
    const pipe = new SafeHtml({} as never);
    expect(pipe).toBeTruthy();
  });
});
