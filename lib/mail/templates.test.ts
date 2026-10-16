import { describe, expect, it } from 'vitest';
import {
  applicationReceivedEmail,
  applicationUnderReviewEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
  leagueProvisionedEmail,
  leagueOwnerWelcomeEmail,
} from '@/lib/mail/templates';

describe('applicant lifecycle email templates', () => {
  it('received: names the league and is a confirmation', () => {
    const m = applicationReceivedEmail({ name: 'Felix', leagueName: 'Summer Cup' });
    expect(m.subject).toContain('Summer Cup');
    expect(m.html).toContain('Summer Cup');
    expect(m.text).toContain('Summer Cup');
  });

  it('under review + approved mention the league', () => {
    expect(applicationUnderReviewEmail({ name: null, leagueName: 'L1' }).html).toContain('L1');
    expect(applicationApprovedEmail({ name: null, leagueName: 'L2' }).html).toContain('L2');
  });

  it('rejected: includes the reason when provided, escaped', () => {
    const withReason = applicationRejectedEmail({
      name: null,
      leagueName: 'L3',
      reason: 'Please provide a phone number',
    });
    expect(withReason.html).toContain('Please provide a phone number');
    expect(withReason.text).toContain('Please provide a phone number');

    const xss = applicationRejectedEmail({
      name: null,
      leagueName: 'L3',
      reason: '<script>alert(1)</script>',
    });
    expect(xss.html).not.toContain('<script>');
    expect(xss.html).toContain('&lt;script&gt;');
  });

  it('rejected: omits the note block cleanly when no reason', () => {
    const m = applicationRejectedEmail({ name: null, leagueName: 'L4' });
    expect(m.html).not.toContain('審閱備註');
    expect(m.html).not.toContain('undefined');
  });

  it('provisioned: links the tenant URL and mentions trial days', () => {
    const m = leagueProvisionedEmail({
      name: 'Felix',
      leagueName: 'Autumn League',
      url: 'https://autumn.zenex-sports.com',
      trialDays: 14,
    });
    expect(m.html).toContain('https://autumn.zenex-sports.com');
    expect(m.html).toContain('14');
    expect(m.text).toContain('https://autumn.zenex-sports.com');
  });

  it('provisioned: omits trial wording when trial is open-ended (0 days)', () => {
    const m = leagueProvisionedEmail({
      name: null,
      leagueName: 'Open League',
      url: 'https://open.zenex-sports.com',
      trialDays: 0,
    });
    expect(m.text).not.toContain('試用');
  });

  it('escapes HTML-significant league names in every template', () => {
    const evil = '<img src=x onerror=alert(1)>';
    for (const m of [
      applicationReceivedEmail({ name: null, leagueName: evil }),
      applicationApprovedEmail({ name: null, leagueName: evil }),
      leagueProvisionedEmail({ name: null, leagueName: evil, url: 'https://e.example.com', trialDays: 14 }),
    ]) {
      expect(m.html).not.toContain('<img');
    }
  });
});

describe('leagueOwnerWelcomeEmail', () => {
  const base = {
    name: 'Felix',
    leagueName: 'Acme Cup',
    email: 'boss@acme.example',
    tempPassword: 'ABC-234-XYZ-999',
    loginUrl: 'https://acme-cup.zenex-sports.com/login',
  };

  it('includes credentials, login url and first-login warning', () => {
    const m = leagueOwnerWelcomeEmail({ ...base, trialDays: 14 });
    expect(m.subject).toContain('Acme Cup');
    expect(m.html).toContain('boss@acme.example');
    expect(m.html).toContain('ABC-234-XYZ-999');
    expect(m.html).toContain('https://acme-cup.zenex-sports.com/login');
    expect(m.text).toContain('ABC-234-XYZ-999');
    expect(m.html).toContain('14');
  });

  it('escapes credentials so a hostile value cannot inject HTML', () => {
    const m = leagueOwnerWelcomeEmail({
      ...base,
      leagueName: '<script>x</script>',
      tempPassword: '<b>x</b>',
      trialDays: 0,
    });
    expect(m.html).not.toContain('<script>');
    expect(m.html).not.toContain('<b>x</b>');
  });
});
