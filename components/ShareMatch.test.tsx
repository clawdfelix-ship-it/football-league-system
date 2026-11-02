import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import ShareMatch from './ShareMatch';

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (_zh: string, en: string) => en }),
}));

describe('ShareMatch', () => {
  it('gives the icon-only control a localized, match-specific accessible name and 44px target', () => {
    const html = renderToStaticMarkup(
      <ShareMatch iconOnly homeTeam="Central Bank" awayTeam="Harbour Athletic" date={null} />,
    );

    expect(html).toContain('aria-label="Share Central Bank vs Harbour Athletic"');
    expect(html).toMatch(/<button[^>]*class="[^"]*h-11 w-11[^"]*"/);
  });
});
