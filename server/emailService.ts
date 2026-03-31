import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "DarkShare <noreply@darkshare.store>";

export interface EmailBroadcastOptions {
  to: string[];
  subject: string;
  html: string;
}

export interface EmailResult {
  sent: number;
  failed: number;
  errors: string[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendEmailBroadcast(options: EmailBroadcastOptions): Promise<EmailResult> {
  const { to, subject, html } = options;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  const BATCH_SIZE = 50;
  for (let i = 0; i < to.length; i += BATCH_SIZE) {
    const batch = to.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (email) => {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject,
          html,
        });
        if (error) {
          failed++;
          errors.push(`${email}: ${error.message}`);
        } else {
          sent++;
        }
      } catch (err: any) {
        failed++;
        errors.push(`${email}: ${err.message || "Unknown error"}`);
      }
    });

    await Promise.all(promises);

    if (i + BATCH_SIZE < to.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return { sent, failed, errors };
}

export async function sendSingleEmail(to: string, subject: string, html: string) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export function buildBroadcastHtml(title: string, body: string): string {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .header { text-align: center; padding: 30px 0; }
  .logo { font-size: 28px; font-weight: 800; color: #a78bfa; letter-spacing: -0.5px; }
  .logo span { color: #ffffff; }
  .card { background: #111118; border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 16px; padding: 32px; margin: 20px 0; }
  .title { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; }
  .body-text { color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0; }
  .body-text p { margin: 0 0 12px 0; }
  .footer { text-align: center; padding: 30px 0; color: #52525b; font-size: 12px; }
  .footer a { color: #a78bfa; text-decoration: none; }
  .divider { height: 1px; background: rgba(167, 139, 250, 0.15); margin: 24px 0; }
  .badge { display: inline-block; background: rgba(167, 139, 250, 0.15); color: #a78bfa; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">DARK<span>SHARE</span></div>
    </div>
    <div class="card">
      <div class="badge">Оновлення</div>
      <h1 class="title">${safeTitle}</h1>
      <div class="divider"></div>
      <div class="body-text">${safeBody}</div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} DarkShare — Digital Risk Assessment Platform</p>
      <p style="margin-top: 8px;"><a href="https://darkshare.store">darkshare.store</a></p>
    </div>
  </div>
</body>
</html>`;
}
