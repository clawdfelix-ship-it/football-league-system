/**
 * lib/mail/templates.ts — HTML 郵件模板（簡約、inline style 兼容各大信箱）
 */

const BRAND = '#0f172a';
const ACCENT = '#b91c1c';

function wrap(title: string, bodyHtml: string, footerHtml = ''): string {
  return `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:${BRAND};padding:20px 24px;">
          <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:0.3px;">Zenex Sports League</span>
        </td></tr>
        <tr><td style="padding:24px;color:#1e293b;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
          ${footerHtml || '此為系統自動發出嘅電郵，請勿直接回覆。<br>© Zenex Sports'}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr><td style="background:${ACCENT};border-radius:10px;">
      <a href="${url}" style="display:inline-block;padding:12px 26px;color:#fff;font-weight:700;font-size:15px;text-decoration:none;">${label}</a>
    </td></tr></table>`;
}

/** D：忘記密碼 — 重設連結 */
export function passwordResetEmail(params: {
  name: string | null;
  url: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = '重設你嘅 Zenex Sports League 密碼';
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">我哋收到你帳號嘅密碼重設要求。請按下面按鈕喺 ${params.expiresMinutes} 分鐘內設定新密碼：</p>
    ${button(params.url, '重設密碼')}
    <p style="margin:12px 0 0;font-size:13px;color:#64748b;">如果個按鈕開唔到，可複製以下網址到瀏覽器：<br>
    <span style="word-break:break-all;color:#334155;">${params.url}</span></p>
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">如果你冇要求重設密碼，可忽略此電郵，你嘅密碼唔會被更改。</p>`;
  const text =
    `重設密碼連結（${params.expiresMinutes} 分鐘內有效）：\n${params.url}\n\n` +
    `如果你冇要求重設密碼，請忽略此電郵。`;
  return { subject, html: wrap(subject, body), text };
}

/** A：帳號已建立（經理），附臨時密碼 */
export function accountCreatedEmail(params: {
  name: string | null;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = '你嘅 Zenex Sports League 帳號已建立';
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">我哋已經幫你開立球隊管理員帳號，你可以登入提交陣容、更新賽果同管理球員資料。</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 14px;width:100%;">
      <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;font-size:14px;">
        <div style="margin-bottom:6px;"><strong>登入電郵：</strong>${params.email}</div>
        <div><strong>臨時密碼：</strong><span style="font-family:Menlo,monospace;color:${ACCENT};">${params.tempPassword}</span></div>
      </td></tr>
    </table>
    ${button(params.loginUrl, '立即登入')}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">為保障帳號安全，首次登入後系統會要求你設定一個新密碼。</p>`;
  const text =
    `你嘅帳號已建立。\n登入電郵：${params.email}\n臨時密碼：${params.tempPassword}\n登入：${params.loginUrl}\n\n首次登入後請即更改密碼。`;
  return { subject, html: wrap(subject, body), text };
}

/** A：帳號密碼已由管理員重設 */
export function passwordResetByAdminEmail(params: {
  name: string | null;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = '你嘅 Zenex Sports League 密碼已重設';
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">管理員已為你重設帳號密碼。請用以下臨時密碼登入：</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 14px;width:100%;">
      <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;font-size:14px;">
        <div style="margin-bottom:6px;"><strong>登入電郵：</strong>${params.email}</div>
        <div><strong>臨時密碼：</strong><span style="font-family:Menlo,monospace;color:${ACCENT};">${params.tempPassword}</span></div>
      </td></tr>
    </table>
    ${button(params.loginUrl, '立即登入')}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">首次登入後請即設定你自己嘅新密碼。</p>`;
  const text =
    `你嘅密碼已被管理員重設。\n登入電郵：${params.email}\n臨時密碼：${params.tempPassword}\n登入：${params.loginUrl}`;
  return { subject, html: wrap(subject, body), text };
}
