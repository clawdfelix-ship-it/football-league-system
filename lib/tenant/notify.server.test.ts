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
  it('always points at the dedicated platform host (apex/www are Shopify)', () => {
    expect(consoleUrl()).toBe('https://platform.zenex-sports.com/platform');
  });
});

describe('applicationNoticeEmail', () => {
  const msg = applicationNoticeEmail(notice);

  it('builds a subject with the league name', () => {
    expect(msg.subject).toContain('Summer Cup');
  });

  it('includes all application fields in the text body', () => {
    expect(msg.text).toContain('#42');
    expect(msg.text).toContain('Felix Chan <felix@example.com>');
    expect(msg.text).toContain('+852 9123 4567');
    expect(msg.text).toContain('summer-cup');
    expect(msg.text).toContain('Weeknight league');
    expect(msg.text).toContain('https://platform.zenex-sports.com/platform');
  });

  it('renders an HTML body linking to the platform console', () => {
    expect(msg.html).toContain('https://platform.zenex-sports.com/platform');
    expect(msg.html).toContain('Summer Cup');
  });

  it('escapes HTML-significant characters in user input', () => {
    const xss = applicationNoticeEmail({
      ...notice,
      leagueName: '<script>x</script>',
      notes: '<b>hi</b>',
    });
    expect(xss.html).not.toContain('<script>');
    expect(xss.html).toContain('&lt;script&gt;');
  });

  it('omits optional blank fields without printing "undefined"', () => {
    const minimal = applicationNoticeEmail({
      id: 7,
      leagueName: 'Bare Cup',
      contactName: 'Pat',
      contactEmail: 'pat@example.com',
    });
    expect(minimal.html).not.toContain('undefined');
    expect(minimal.text).not.toContain('undefined');
    expect(minimal.text).toContain('Bare Cup');
  });
});
