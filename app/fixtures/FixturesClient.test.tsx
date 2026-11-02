import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FixturesClient, { type Match } from './FixturesClient';

vi.mock('@/components/HomeLayout', () => ({ default: ({ children }: React.PropsWithChildren) => children }));
vi.mock('@/components/PageHero', () => ({ default: () => null }));
vi.mock('@/components/MatchWeather', () => ({ default: () => null }));
vi.mock('@/components/ShareMatch', () => ({
  default: ({ iconOnly, homeTeam, awayTeam }: { iconOnly?: boolean; homeTeam: string; awayTeam: string }) => (
    <button aria-label={`Share ${homeTeam} vs ${awayTeam}`} className={iconOnly ? 'h-11 w-11' : ''}>Share</button>
  ),
}));
vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (_zh: string, en: string) => en }),
}));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: <T,>(initial: T | (() => T)) => actual.useState<T>((typeof initial === 'boolean' ? true : initial) as T),
  };
});

const baseMatch: Match = {
  id: 1, homeTeam: 'Central Bank', awayTeam: 'Harbour Athletic', date: null,
  venue: null, round: 'Round 1', status: 'upcoming', homeScore: null, awayScore: null,
};

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('non-boolean attribute')) return;
    console.warn(...args);
  });
});
afterEach(() => consoleError.mockRestore());

describe('FixturesClient mobile presentation', () => {
  it('uses soonest-first order for upcoming fixtures and puts TBC last', () => {
    const html = renderToStaticMarkup(
      <FixturesClient matches={[
        { ...baseMatch, id: 3, homeTeam: 'TBC FC', date: null },
        { ...baseMatch, id: 2, homeTeam: 'Later FC', date: '2026-12-01T12:00:00Z' },
        { ...baseMatch, id: 1, homeTeam: 'Soon FC', date: '2026-11-03T12:00:00Z' },
      ]} teams={{}} allOverrides={{}} />,
    );

    expect(html.indexOf('Soon FC')).toBeLessThan(html.indexOf('Later FC'));
    expect(html.indexOf('Later FC')).toBeLessThan(html.indexOf('TBC FC'));
  });

  it('gives mobile Calendar and Share controls at least 44px hit areas', () => {
    const html = renderToStaticMarkup(
      <FixturesClient matches={[{ ...baseMatch, date: '2026-11-03T12:00:00Z' }]} teams={{}} allOverrides={{}} />,
    );
    const mobile = html.split('md:hidden')[1].split('hidden md:flex')[0];

    expect(mobile).toMatch(/<a[^>]*aria-label="Calendar"[^>]*class="[^"]*h-11 w-11[^"]*"/);
    expect(mobile).toContain('class="h-11 w-11"');
  });

  it('keeps each mobile result score beside its own team', () => {
    const html = renderToStaticMarkup(
      <FixturesClient matches={[{ ...baseMatch, status: 'finished', homeScore: 4, awayScore: 2 }]} teams={{}} allOverrides={{}} />,
    );
    const mobile = html.split('md:hidden')[1].split('hidden md:flex')[0];

    expect(mobile).toMatch(/Central Bank<\/span><span[^>]*>4<\/span>/);
    expect(mobile).toMatch(/Harbour Athletic<\/span><span[^>]*>2<\/span>/);
    expect(mobile).not.toContain('>4-2<');
  });
});
