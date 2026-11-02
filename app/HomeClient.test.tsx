import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import HomeClient from './HomeClient';

vi.mock('@/components/HomeLayout', () => ({ default: ({ children }: React.PropsWithChildren) => children }));
vi.mock('@/components/Logo', () => ({ default: () => null }));
vi.mock('@/components/MatchWeather', () => ({ default: () => null }));
vi.mock('@/components/ShareMatch', () => ({ default: () => null }));
vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (_zh: string, en: string) => en }),
}));

describe('HomeClient responsive standings', () => {
  it('hides only the mobile GF:GA column below the desktop breakpoint, retaining GD', () => {
    const html = renderToStaticMarkup(<HomeClient initial={{
      teamSettings: [], fixtures: [], results: [], announcements: [],
      teams: [{ name: 'A Very Long Banking Football Team', nameZh: 'A Very Long Banking Football Team', shortName: 'Long Bank', color: 'from-slate-600 to-slate-800' }],
    }} />);

    expect(html).toMatch(/<th[^>]*class="[^"]*hidden md:table-cell[^"]*"[^>]*>GF:GA<\/th>/);
    expect(html).toMatch(/<td[^>]*class="[^"]*hidden md:table-cell[^"]*"[^>]*>0:0<\/td>/);
    expect(html).toContain('>GD</th>');
    expect(html).not.toMatch(/<th[^>]*class="[^"]*hidden md:table-cell[^"]*"[^>]*>W-D-L<\/th>/);
  });
});
