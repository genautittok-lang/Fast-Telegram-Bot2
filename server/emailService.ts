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
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#08080d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#08080d;">
    <tr>
      <td align="center" style="padding:20px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 0 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:32px;font-weight:800;letter-spacing:-0.5px;">
                    <span style="color:#a78bfa;">DARK</span><span style="color:#ffffff;">SHARE</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <span style="color:#52525b;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Digital Risk Assessment</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Decorative line -->
          <tr>
            <td align="center" style="padding:0 40px;">
              <table role="presentation" width="80" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:3px;background:linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed);border-radius:2px;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="padding:24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111118;border:1px solid rgba(167,139,250,0.15);border-radius:20px;overflow:hidden;">
                
                <!-- Purple accent top bar -->
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#7c3aed,#a78bfa,#c084fc);"></td>
                </tr>
                
                <!-- Card content -->
                <tr>
                  <td style="padding:36px 32px 32px;">
                    
                    <!-- Badge -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:rgba(167,139,250,0.12);color:#a78bfa;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                          &#9733; Оновлення
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Title -->
                    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:20px 0 0;line-height:1.3;">${safeTitle}</h1>
                    
                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
                      <tr><td style="height:1px;background-color:rgba(167,139,250,0.12);"></td></tr>
                    </table>
                    
                    <!-- Body text -->
                    <div style="color:#a1a1aa;font-size:15px;line-height:1.8;margin:0;">${safeBody}</div>
                    
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Buttons -->
          <tr>
            <td style="padding:8px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Website Button -->
                  <td width="48%" align="center" style="padding-right:8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:12px;padding:0;">
                          <a href="https://darkshare.store" target="_blank" style="display:block;padding:14px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.3px;">
                            &#127760; Відкрити сайт
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Bot Button -->
                  <td width="48%" align="center" style="padding-left:8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="background-color:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.25);border-radius:12px;padding:0;">
                          <a href="https://t.me/DarkShare1Bot" target="_blank" style="display:block;padding:14px 20px;color:#a78bfa;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.3px;">
                            &#129302; Telegram бот
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Features Strip -->
          <tr>
            <td style="padding:0 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:rgba(167,139,250,0.05);border:1px solid rgba(167,139,250,0.08);border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="33%" align="center" style="padding:4px 0;">
                          <span style="color:#a78bfa;font-size:20px;">&#128274;</span>
                          <br>
                          <span style="color:#71717a;font-size:11px;font-weight:500;">17 типів аналізу</span>
                        </td>
                        <td width="33%" align="center" style="padding:4px 0;">
                          <span style="color:#a78bfa;font-size:20px;">&#129302;</span>
                          <br>
                          <span style="color:#71717a;font-size:11px;font-weight:500;">AI Risk Score</span>
                        </td>
                        <td width="33%" align="center" style="padding:4px 0;">
                          <span style="color:#a78bfa;font-size:20px;">&#128196;</span>
                          <br>
                          <span style="color:#71717a;font-size:11px;font-weight:500;">PDF звіти</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Social links -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                      <tr>
                        <td style="padding:0 8px;">
                          <a href="https://darkshare.store" style="color:#52525b;text-decoration:none;font-size:12px;">&#127760; Сайт</a>
                        </td>
                        <td style="color:#333;font-size:12px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="https://t.me/DarkShare1Bot" style="color:#52525b;text-decoration:none;font-size:12px;">&#128172; Бот</a>
                        </td>
                        <td style="color:#333;font-size:12px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="mailto:darkshare.store@gmail.com" style="color:#52525b;text-decoration:none;font-size:12px;">&#9993; Підтримка</a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color:#3f3f46;font-size:11px;margin:0 0 6px;">
                      &copy; ${new Date().getFullYear()} DarkShare — Digital Risk Assessment Platform
                    </p>
                    <p style="color:#27272a;font-size:10px;margin:0;">
                      Ви отримали цей лист, тому що зареєструвались на darkshare.store
                    </p>
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
