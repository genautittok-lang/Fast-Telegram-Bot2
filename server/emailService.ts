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
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<title>DarkShare</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:16px;">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:40px 20px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'Trebuchet MS','Segoe UI',Roboto,Arial,sans-serif;font-size:36px;font-weight:800;letter-spacing:3px;line-height:1;">
                          <span style="color:#22c55e;">DARK</span><span style="color:#ffffff;">SHARE</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:10px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:24px;height:1px;background-color:#16a34a;font-size:0;">&nbsp;</td>
                        <td style="padding:0 10px;color:#3b7a4a;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:4px;font-family:'Segoe UI',Roboto,Arial,sans-serif;white-space:nowrap;">Security Intelligence</td>
                        <td style="width:24px;height:1px;background-color:#16a34a;font-size:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT CARD -->
          <tr>
            <td style="padding:0 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:16px;overflow:hidden;border:1px solid #162b1c;">
                <tr><td style="height:3px;background-color:#22c55e;font-size:0;">&nbsp;</td></tr>
                <tr>
                  <td style="background-color:#0a1210;padding:32px 28px 28px;">

                    <p style="color:#f0fdf4;font-size:22px;font-weight:700;margin:0 0 16px;line-height:1.35;font-family:'Segoe UI',Roboto,Arial,sans-serif;">${safeTitle}</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                      <tr><td style="height:1px;background-color:#162b1c;font-size:0;">&nbsp;</td></tr>
                    </table>

                    <div style="color:#8faa96;font-size:15px;line-height:1.8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">${safeBody}</div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BUTTONS -->
          <tr>
            <td style="padding:20px 12px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="49%" style="padding-right:6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#16a34a;border-radius:10px;">
                          <a href="https://darkshare.store" target="_blank" style="display:block;padding:14px 8px;color:#ffffff;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;text-align:center;">&#127760;&nbsp; darkshare.store</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="49%" style="padding-left:6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border:1px solid #22c55e;border-radius:10px;background-color:#091a0e;">
                          <a href="https://t.me/DarkShare1Bot" target="_blank" style="display:block;padding:13px 8px;color:#4ade80;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;text-align:center;">&#128172;&nbsp; @DarkShare1Bot</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px;background-color:#111;font-size:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding-top:20px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                    <p style="color:#1e3a25;font-size:11px;margin:0 0 4px;">&copy; ${new Date().getFullYear()} DarkShare</p>
                    <p style="color:#111;font-size:10px;margin:0;">darkshare.store@gmail.com</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
