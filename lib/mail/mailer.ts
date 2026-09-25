/**
 * lib/mail/mailer.ts — Zoho Mail SMTP 發信層
 *
 * 環境變數（喺 Vercel 設定，唔好入 git）：
 *   SMTP_HOST      預設 smtp.zoho.com（國際版）；如用 Zoho HK 可設 smtp.zoho.com.hk
 *   SMTP_PORT      預設 465（SSL）；587 用 STARTTLS
 *   SMTP_USER      登入帳號，例如 hello@zenex-sports.com
 *   SMTP_PASS      應用程式密碼（app-specific password）
 *   SMTP_FROM      發信地址，預設同 SMTP_USER
 *   MAIL_FROM_NAME 寄件者顯示名稱，預設 Zenex Sports League
 *
 * SMTP 設定唔齊就「靜默關閉」（sendMail 拋 MailNotConfiguredError），
 * 令本地開發 / 未設密碼時唔會阻塞主流程，由調用方決定點處理。
 */
import nodemailer, { type Transporter } from 'nodemailer';

export class MailNotConfiguredError extends Error {
  constructor() {
    super('SMTP is not configured');
    this.name = 'MailNotConfiguredError';
  }
}

let cached: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (cached) return cached;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new MailNotConfiguredError();
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465; // 465 = SSL；其他（587）STARTTLS

  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cached;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  replyTo?: string;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const transporter = getTransporter();
  const fromAddr = process.env.SMTP_FROM || process.env.SMTP_USER;
  const fromName = process.env.MAIL_FROM_NAME || 'Zenex Sports League';

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: Array.isArray(input.to) ? input.to.join(', ') : input.to,
    cc: input.cc ? (Array.isArray(input.cc) ? input.cc.join(', ') : input.cc) : undefined,
    replyTo: input.replyTo,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
