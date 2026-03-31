import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "DarkShare <info@darkshare.store>";

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

const emailHeaders = {
  "X-Priority": "1",
  "X-Mailer": "DarkShare Platform",
  "Precedence": "bulk",
  "List-Unsubscribe": "<mailto:darkshare.store@gmail.com?subject=unsubscribe>",
};

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
          headers: emailHeaders,
          replyTo: "darkshare.store@gmail.com",
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
    headers: emailHeaders,
    replyTo: "darkshare.store@gmail.com",
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
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">

          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #e5e5e5;">
              <span style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:20px;font-weight:700;color:#111;">DARKSHARE</span>
              <span style="font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#888;margin-left:8px;">Security Platform</span>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px;">
              <p style="color:#111;font-size:18px;font-weight:600;margin:0 0 16px;line-height:1.4;font-family:'Segoe UI',Roboto,Arial,sans-serif;">${safeTitle}</p>
              <div style="color:#333;font-size:15px;line-height:1.7;font-family:'Segoe UI',Roboto,Arial,sans-serif;">${safeBody}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="https://darkshare.store" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#16a34a;color:#ffffff;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:600;border-radius:6px;">darkshare.store</a>
                  </td>
                  <td>
                    <a href="https://t.me/DarkShare1Bot" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#229ED9;color:#ffffff;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:600;border-radius:6px;">Telegram</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e5e5;background-color:#fafafa;">
              <p style="color:#999;font-size:12px;margin:0 0 4px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">&copy; ${new Date().getFullYear()} DarkShare &mdash; darkshare.store</p>
              <p style="color:#bbb;font-size:11px;margin:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                <a href="https://www.instagram.com/darkshare.store" target="_blank" style="color:#999;text-decoration:none;">Instagram</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:darkshare.store@gmail.com" style="color:#999;text-decoration:none;">darkshare.store@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
