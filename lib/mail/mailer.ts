/**
 * lib/mail/mailer.ts — Transactional email layer (dual transport)
 *
 * Two transports, selected by env at send time:
 *
 * 1. Zoho ZeptoMail HTTP API (preferred on serverless — no long-lived SMTP
 *    socket, works well from Vercel functions):
 *      ZEPTOMAIL_TOKEN   send-mail API token (from ZeptoMail console)
 *      ZEPTOMAIL_FROM    verified sender address (defaults to SMTP_FROM/SMTP_USER)
 *      ZEPTOMAIL_REGION  optional "eu" -> api.zeptomail.eu; default global host
 *    Docs: POST /v1.1/email, header `Authorization: Zoho-enczapikey <token>`.
 *
 * 2. Zoho Mail SMTP (nodemailer), used when no ZeptoMail token is present:
 *      SMTP_HOST  default smtp.zoho.com (use smtp.zoho.com.hk for Zoho HK)
 *      SMTP_PORT  default 465 (SSL); 587 = STARTTLS
 *      SMTP_USER  e.g. hello@zenex-sports.com
 *      SMTP_PASS  app-specific password
 *      SMTP_FROM  defaults to SMTP_USER
 *
 * Note: a regular Zoho Mail mailbox has no public send REST API; ZeptoMail is
 * Zoho's transactional-email API product and uses a separate send token.
 *
 * When neither is configured the layer throws MailNotConfiguredError so callers
 * can degrade gracefully (never block the main flow on email).
 */
import nodemailer, { type Transporter } from 'nodemailer';

export class MailNotConfiguredError extends Error {
  constructor() {
    super('Mail transport is not configured');
    this.name = 'MailNotConfiguredError';
  }
}

let cachedSmtp: Transporter | null = null;

export type MailTransport = 'zeptomail' | 'smtp';

export function getMailTransport(): MailTransport | null {
  if (process.env.ZEPTOMAIL_TOKEN) return 'zeptomail';
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return null;
}

export function isMailConfigured(): boolean {
  return getMailTransport() !== null;
}

function fromAddress(): string {
  return process.env.ZEPTOMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '';
}

function fromName(): string {
  return process.env.MAIL_FROM_NAME || 'Zenex Sports League';
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  replyTo?: string;
}

function toAddressList(input: string | string[]): Array<{ email_address: { address: string } }> {
  const arr = Array.isArray(input) ? input : [input];
  return arr
    .map((a) => a.trim())
    .filter(Boolean)
    .map((address) => ({ email_address: { address } }));
}

/** Build the ZeptoMail v1.1 request payload (exported for unit tests). */
export function buildZeptoPayload(input: SendMailInput) {
  const payload: Record<string, unknown> = {
    from: { address: fromAddress(), name: fromName() },
    to: toAddressList(input.to),
    subject: input.subject,
    htmlbody: input.html,
  };
  const text = input.text?.trim();
  if (text) payload.textbody = text;
  if (input.cc) {
    const cc = toAddressList(input.cc);
    if (cc.length) payload.cc = cc;
  }
  if (input.replyTo?.trim()) payload.reply_to = { address: input.replyTo.trim() };
  return payload;
}

async function sendViaZepto(input: SendMailInput): Promise<void> {
  const token = process.env.ZEPTOMAIL_TOKEN!;
  const host =
    process.env.ZEPTOMAIL_REGION === 'eu' ? 'api.zeptomail.eu' : 'api.zeptomail.com';

  const res = await fetch(`https://${host}/v1.1/email`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-enczapikey ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(buildZeptoPayload(input)),
    // Do not let a slow mail API hang a serverless function.
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ZeptoMail send failed: ${res.status} ${detail.slice(0, 300)}`);
  }
}

function getSmtpTransporter(): Transporter {
  if (cachedSmtp) return cachedSmtp;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new MailNotConfiguredError();
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465; // 465 = SSL; others (587) STARTTLS

  cachedSmtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedSmtp;
}

async function sendViaSmtp(input: SendMailInput): Promise<void> {
  const transporter = getSmtpTransporter();
  const fromAddr = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName()}" <${fromAddr}>`,
    to: Array.isArray(input.to) ? input.to.join(', ') : input.to,
    cc: input.cc ? (Array.isArray(input.cc) ? input.cc.join(', ') : input.cc) : undefined,
    replyTo: input.replyTo,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const transport = getMailTransport();
  if (transport === 'zeptomail') return sendViaZepto(input);
  if (transport === 'smtp') return sendViaSmtp(input);
  throw new MailNotConfiguredError();
}
