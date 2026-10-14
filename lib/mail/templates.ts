/**
 * lib/mail/templates.ts — HTML 郵件模板（簡約、inline style 兼容各大信箱）
 */

const BRAND = '#0f172a';
const ACCENT = '#b91c1c';

function escAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(title: string, bodyHtml: string, footerHtml = ''): string {
  return `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escAttr(title)}</title></head>
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

/* ── League application lifecycle (applicant-facing) ───────────────────── */

function escHtml(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 申請已收到（提交後即時確認） */
export function applicationReceivedEmail(params: {
  name: string | null;
  leagueName: string;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = `已收到你嘅聯賽申請：${params.leagueName}`;
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">我哋已經收到你開辦「<strong>${escHtml(params.leagueName)}</strong>」嘅申請，團隊會盡快審閱。審批結果會發送到呢個電郵地址，一般需時幾個工作天。</p>
    <p style="margin:0 0 12px;font-size:13px;color:#64748b;">如果你冇提交過呢個申請，可忽略此電郵。</p>`;
  const text = `我哋已收到你開辦「${params.leagueName}」嘅申請，會盡快審閱，結果將以電郵通知。`;
  return { subject, html: wrap(subject, body), text };
}

/** 申請進入審閱中 */
export function applicationUnderReviewEmail(params: {
  name: string | null;
  leagueName: string;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = `你嘅聯賽申請正在審閱：${params.leagueName}`;
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">你開辦「<strong>${escHtml(params.leagueName)}</strong>」嘅申請而家正在審閱中，我哋可能會透過你提供嘅聯絡方法同你跟進。請耐心等候結果。</p>`;
  const text = `你開辦「${params.leagueName}」嘅申請正在審閱中，請耐心等候結果。`;
  return { subject, html: wrap(subject, body), text };
}

/** 申請已批准（仍未開通，預備中） */
export function applicationApprovedEmail(params: {
  name: string | null;
  leagueName: string;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = `你嘅聯賽申請已獲批准：${params.leagueName}`;
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">好消息！你開辦「<strong>${escHtml(params.leagueName)}</strong>」嘅申請已經<strong>獲得批准</strong>。我哋而家為你準備聯賽網站，完成後會再發一封電郵通知你登入網址同下一步。</p>`;
  const text = `你開辦「${params.leagueName}」嘅申請已獲批准！我哋正為你準備聯賽網站，完成後會再以電郵通知登入網址。`;
  return { subject, html: wrap(subject, body), text };
}

/** 申請被拒絕（附原因，可重新申請） */
export function applicationRejectedEmail(params: {
  name: string | null;
  leagueName: string;
  reason?: string | null;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = `關於你嘅聯賽申請：${params.leagueName}`;
  const reasonBlock = params.reason?.trim()
    ? `<p style="margin:0 0 12px;"><strong>審閱備註：</strong></p><blockquote style="margin:0 0 12px;padding:10px 14px;border-left:3px solid ${ACCENT};background:#f8fafc;border-radius:6px;">${escHtml(params.reason)}</blockquote>`
    : '';
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">多謝你申請開辦「<strong>${escHtml(params.leagueName)}</strong>」。經審閱後，我哋暫時未能批准呢個申請。</p>
    ${reasonBlock}
    <p style="margin:0 0 12px;">如果你有疑問，或者想跟進，可以回覆呢封電郵；資料補齊後亦可重新遞交申請。</p>`;
  const text =
    `你開辦「${params.leagueName}」嘅申請暫未獲批准。\n` +
    (params.reason?.trim() ? `審閱備註：${params.reason}\n` : '') +
    `如有疑問可回覆此電郵，資料補齊後可重新申請。`;
  return { subject, html: wrap(subject, body), text };
}

/** 聯賽已開通（附網址同試用期） */
export function leagueProvisionedEmail(params: {
  name: string | null;
  leagueName: string;
  url: string;
  trialDays: number;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = `你嘅聯賽網站已開通：${params.leagueName}`;
  const trialLine = params.trialDays > 0
    ? `你嘅帳號包含 <strong>${params.trialDays} 日免費試用</strong>，我哋會喺試用完結前同你聯絡後續安排。`
    : '';
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">你嘅聯賽「<strong>${escHtml(params.leagueName)}</strong>」網站已經準備好，可以即刻瀏覽：</p>
    ${button(params.url, '打開我嘅聯賽網站')}
    <p style="margin:12px 0 0;font-size:13px;color:#64748b;word-break:break-all;">網址：${escHtml(params.url)}</p>
    <p style="margin:12px 0 0;">${trialLine}</p>
    <p style="margin:12px 0 0;font-size:13px;color:#64748b;">我哋嘅團隊好快會再聯絡你，提供管理員帳號同埋上手協助。</p>`;
  const text =
    `你嘅聯賽「${params.leagueName}」網站已開通：${params.url}\n` +
    (params.trialDays > 0 ? `帳號包含 ${params.trialDays} 日免費試用。\n` : '') +
    `我哋好快會再聯絡你提供管理員帳號。`;
  return { subject, html: wrap(subject, body), text };
}

/** 聯賽主辦（owner）帳號已建立＋網站已開通（含臨時密碼） */
export function leagueOwnerWelcomeEmail(params: {
  name: string | null;
  leagueName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  trialDays: number;
}): { subject: string; html: string; text: string } {
  const hi = params.name ? `${params.name}，你好：` : '你好：';
  const subject = `你嘅聯賽管理帳號已開通：${params.leagueName}`;
  const trialLine = params.trialDays > 0
    ? `<p style="margin:0 0 12px;">帳號包含 <strong>${params.trialDays} 日免費試用</strong>，我哋會喺試用完結前同你聯絡後續安排。</p>`
    : '';
  const body = `
    <p style="margin:0 0 12px;">${hi}</p>
    <p style="margin:0 0 12px;">你開辦嘅聯賽「<strong>${escHtml(params.leagueName)}</strong>」網站同<strong>聯賽管理後台</strong>已經準備好。你可以登入管理球隊、球員、賽程同賽果。</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 14px;width:100%;">
      <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;font-size:14px;">
        <div style="margin-bottom:6px;"><strong>登入電郵：</strong>${escHtml(params.email)}</div>
        <div style="margin-bottom:6px;"><strong>臨時密碼：</strong><span style="font-family:Menlo,monospace;color:${ACCENT};">${escHtml(params.tempPassword)}</span></div>
        <div style="font-size:13px;color:#64748b;word-break:break-all;">管理後台登入：${escHtml(params.loginUrl)}</div>
      </td></tr>
    </table>
    ${button(params.loginUrl, '進入管理後台')}
    ${trialLine}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">為保障帳號安全，首次登入後系統會要求你設定一個新密碼。此密碼只發送一次，請妥善保存。</p>`;
  const text =
    `你嘅聯賽「${params.leagueName}」管理帳號已開通。\n` +
    `登入電郵：${params.email}\n` +
    `臨時密碼：${params.tempPassword}\n` +
    `管理後台：${params.loginUrl}\n` +
    (params.trialDays > 0 ? `帳號包含 ${params.trialDays} 日免費試用。\n` : '') +
    `首次登入後請即更改密碼。`;
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
