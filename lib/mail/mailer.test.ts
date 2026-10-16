import { afterEach, describe, expect, it } from 'vitest';
import { buildZeptoPayload, getMailTransport, isMailConfigured } from '@/lib/mail/mailer';

afterEach(() => {
  delete process.env.ZEPTOMAIL_TOKEN;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.SMTP_FROM;
  delete process.env.ZEPTOMAIL_FROM;
});

describe('getMailTransport', () => {
  it('prefers zeptomail when a token is present', () => {
    process.env.ZEPTOMAIL_TOKEN = 'ztoken';
    process.env.SMTP_USER = 'a';
    process.env.SMTP_PASS = 'b';
    expect(getMailTransport()).toBe('zeptomail');
    expect(isMailConfigured()).toBe(true);
  });

  it('falls back to smtp with only SMTP creds', () => {
    process.env.SMTP_USER = 'hello@zenex-sports.com';
    process.env.SMTP_PASS = 'secret';
    expect(getMailTransport()).toBe('smtp');
  });

  it('reports unconfigured without either', () => {
    expect(getMailTransport()).toBeNull();
    expect(isMailConfigured()).toBe(false);
  });
});

describe('buildZeptoPayload', () => {
  it('shapes recipients, from and bodies per v1.1 API', () => {
    process.env.ZEPTOMAIL_FROM = 'hello@zenex-sports.com';
    const payload = buildZeptoPayload({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Hi',
      html: '<p>Hi</p>',
      text: 'Hi',
      cc: 'cc@example.com',
      replyTo: 'reply@example.com',
    }) as Record<string, unknown>;

    expect(payload.from).toEqual({ address: 'hello@zenex-sports.com', name: expect.any(String) });
    expect(payload.to).toEqual([
      { email_address: { address: 'a@example.com' } },
      { email_address: { address: 'b@example.com' } },
    ]);
    expect(payload.cc).toEqual([{ email_address: { address: 'cc@example.com' } }]);
    expect(payload.reply_to).toEqual({ address: 'reply@example.com' });
    expect(payload.subject).toBe('Hi');
    expect(payload.htmlbody).toBe('<p>Hi</p>');
    expect(payload.textbody).toBe('Hi');
  });

  it('omits textbody/cc/reply_to when not provided', () => {
    const payload = buildZeptoPayload({ to: 'a@example.com', subject: 'S', html: '<p/>' }) as Record<string, unknown>;
    expect(payload.textbody).toBeUndefined();
    expect(payload.cc).toBeUndefined();
    expect(payload.reply_to).toBeUndefined();
  });
});
