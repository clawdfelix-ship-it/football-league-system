import { describe, it, expect, beforeEach } from 'vitest';
import {
  applicationNoticeEmail,
  consoleUrl,
  type ApplicationNotice,
} from './notify.server';

const notice: ApplicationNotice = {
  id: 42,
  leagueName: 'Summer Cup',
  contactName: 'Felix Chan',
  contactEmail: 'felix@example.com',
  contactPhone: '+852 9123 4567',
  sportType: 'football',
  teamCountEst: 10,
  notes: 'Weeknight league',
  requestedSlug: 'summer-cup',
};

beforeEach(() => {
  delete process.env.TENANT_BASE_DOMAIN;
});

describe('consoleUrl', () => {
  it('uses the apex platform domain for a tenant subdomain', () => {
    expect(consoleUrl('summer-cup.zenex-sports.com')).toBe(
      'https://zenex-sports.com/platform'
    );
  });

  it('strips www and scheme/path', () => {
    expect(consoleUrl('https://www.zenex-sports.com/some/path')).toBe(
      'https://zenex-sports.com/platform'
    );
  });

  it('keeps vercel/localhost hosts at /platform on that host', () => {
    expect(consoleUrl('football-x.vercel.app')).toBe(
      'https://football-x.vercel.app/platform'
    );
    expect(consoleUrl('localhost:3000')).toBe('https://localhost:3000/platform');
  });

  it('falls back to the configured apex when host is absent', () => {
    process.env.TENANT_BASE_DOMAIN = 'games.example.org';
    expect(consoleUrl(null)).toBe('https://games.example.org/platform');
  });

  it('honours TENANT_BASE_DOMAIN override for matching subdomains', () => {
    process.env.TENANT_BASE_DOMAIN = 'games.example.org';
    expect(consoleUrl('acme.games.example.org')).toBe(
      'https://games.example.org/platform'
    );
  });
});

describe('applicationNoticeEmail', () => {
  const msg = applicationNoticeEmail(notice, 'summer-cup.zenex-sports.com');

  it('builds a subject with the league name', () => {
    expect(msg.subject).toContain('Summer Cup');
  });

  it('includes all application fields in the text body', () => {
    expect(msg.text).toContain('#42');
    expect(msg.text).toContain('Felix Chan <felix@example.com>');
    expect(msg.text).toContain('+852 9123 4567');
    expect(msg.text).toContain('summer-cup');
    expect(msg.text).toContain('Weeknight league');
    expect(msg.text).toContain('https://zenex-sports.com/platform');
  });

  it('renders an HTML body linking to the console', () => {
    expect(msg.html).toContain('https://zenex-sports.com/platform');
    expect(msg.html).toContain('Summer Cup');
  });

  it('escapes HTML-significant characters in user input', () => {
    const xss = applicationNoticeEmail(
      { ...notice, leagueName: '<script>x</script>', notes: '<b>hi</b>' },
      'x.zenex-sports.com'
    );
    expect(xss.html).not.toContain('<script>');
    expect(xss.html).toContain('&lt;script&gt;');
  });

  it('omits optional blank fields without printing "undefined"', () => {
    const minimal = applicationNoticeEmail(
      {
        id: 7,
        leagueName: 'Bare Cup',
        contactName: 'Pat',
        contactEmail: 'pat@example.com',
      },
      null
    );
    expect(minimal.html).not.toContain('undefined');
    expect(minimal.text).not.toContain('undefined');
    expect(minimal.text).toContain('Bare Cup');
  });
});
