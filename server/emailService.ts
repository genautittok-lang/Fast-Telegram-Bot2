import { Resend } from "resend";
import fs from "fs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "DarkShare <noreply@darkshare.store>";

let logoBase64: string | null = null;
try {
  const logoPath = path.join(process.cwd(), "client", "public", "logo.png");
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = logoBuffer.toString("base64");
  }
} catch {}

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
        const sendOptions: any = {
          from: FROM_EMAIL,
          to: email,
          subject,
          html,
        };
        if (logoBase64) {
          sendOptions.attachments = [{
            filename: "logo.png",
            content: logoBase64,
            content_type: "image/png",
          }];
          sendOptions.headers = { "X-Entity-Ref-ID": new Date().getTime().toString() };
        }
        const { data, error } = await resend.emails.send(sendOptions);
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
  const sendOptions: any = {
    from: FROM_EMAIL,
    to,
    subject,
    html,
  };
  if (logoBase64) {
    sendOptions.attachments = [{
      filename: "logo.png",
      content: logoBase64,
      content_type: "image/png",
    }];
    sendOptions.headers = { "X-Entity-Ref-ID": new Date().getTime().toString() };
  }
  const { data, error } = await resend.emails.send(sendOptions);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export function buildBroadcastHtml(title: string, body: string): string {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="uk" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<title>DarkShare</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#050a07;">
  <div role="article" aria-roledescription="email" lang="uk" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#050a07;">
    <table role="presentation" style="width:100%;border:none;border-spacing:0;background-color:#050a07;">
      <tr>
        <td align="center" style="padding:0;">

          <!--[if mso]><table role="presentation" align="center" style="width:640px;"><tr><td style="padding:0;"><![endif]-->
          <div style="max-width:640px;margin:0 auto;">
            <table role="presentation" style="width:100%;border:none;border-spacing:0;">

              <!-- ===== TOP SPACER ===== -->
              <tr><td style="padding:24px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>

              <!-- ===== HEADER ===== -->
              <tr>
                <td style="padding:32px 32px 24px;text-align:center;">
                  <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                    <tr>
                      <td align="center" style="padding-bottom:20px;">
                        <table role="presentation" style="border:none;border-spacing:0;">
                          <tr>
                            <td style="width:56px;height:56px;border-radius:14px;background-color:#0d1f12;border:2px solid #16a34a;text-align:center;vertical-align:middle;font-size:28px;">
                              &#128737;
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                        <span style="font-size:28px;font-weight:800;color:#22c55e;letter-spacing:1px;">DARK</span><span style="font-size:28px;font-weight:800;color:#f0fdf4;letter-spacing:1px;">SHARE</span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:8px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                        <span style="font-size:10px;color:#2d5a38;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Digital Risk Assessment Platform</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ===== GREEN LINE ===== -->
              <tr>
                <td style="padding:0 80px;font-size:0;line-height:0;">
                  <div style="height:2px;background-color:#22c55e;border-radius:1px;opacity:0.6;"></div>
                </td>
              </tr>

              <!-- ===== MAIN CONTENT CARD ===== -->
              <tr>
                <td style="padding:24px 20px;">
                  <table role="presentation" style="width:100%;border:none;border-spacing:0;border-radius:16px;overflow:hidden;">
                    <!-- Green top accent -->
                    <tr><td style="height:3px;background-color:#22c55e;font-size:0;line-height:0;">&nbsp;</td></tr>
                    <tr>
                      <td style="background-color:#0a1a0e;border-left:1px solid #133a1c;border-right:1px solid #133a1c;border-bottom:1px solid #133a1c;border-radius:0 0 16px 16px;padding:0;">
                        <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                          <tr>
                            <td style="padding:32px 28px 28px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

                              <!-- Badge -->
                              <table role="presentation" style="border:none;border-spacing:0;">
                                <tr>
                                  <td style="background-color:#0d2614;border:1px solid #16a34a;color:#4ade80;padding:4px 14px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">
                                    &#9733; ОНОВЛЕННЯ
                                  </td>
                                </tr>
                              </table>

                              <!-- Title -->
                              <p style="color:#f0fdf4;font-size:22px;font-weight:700;margin:20px 0 0;line-height:1.35;">${safeTitle}</p>

                              <!-- Divider -->
                              <table role="presentation" style="width:100%;border:none;border-spacing:0;margin:18px 0;">
                                <tr><td style="height:1px;background-color:#133a1c;font-size:0;line-height:0;">&nbsp;</td></tr>
                              </table>

                              <!-- Body -->
                              <div style="color:#86a68f;font-size:15px;line-height:1.75;margin:0;">${safeBody}</div>

                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ===== CTA BUTTONS ===== -->
              <tr>
                <td style="padding:4px 20px 16px;">
                  <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                    <tr>
                      <!-- Website -->
                      <td style="width:48%;padding-right:6px;">
                        <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                          <tr>
                            <td align="center" style="background-color:#16a34a;border-radius:12px;">
                              <a href="https://darkshare.store" target="_blank" style="display:block;padding:14px 8px;color:#ffffff;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;text-align:center;">&#127760;&nbsp;&nbsp;Відкрити сайт</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <!-- Bot -->
                      <td style="width:48%;padding-left:6px;">
                        <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                          <tr>
                            <td align="center" style="border:2px solid #16a34a;border-radius:12px;background-color:#071a0c;">
                              <a href="https://t.me/DarkShare1Bot" target="_blank" style="display:block;padding:12px 8px;color:#4ade80;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;text-align:center;">&#128172;&nbsp;&nbsp;Telegram бот</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ===== FEATURES ===== -->
              <tr>
                <td style="padding:4px 20px 20px;">
                  <table role="presentation" style="width:100%;border:none;border-spacing:0;background-color:#071a0c;border:1px solid #0d2614;border-radius:12px;">
                    <tr>
                      <td style="padding:16px 8px;">
                        <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                          <tr>
                            <td align="center" width="25%" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;padding:4px 2px;">
                              <span style="font-size:20px;display:block;padding-bottom:4px;">&#128270;</span>
                              <span style="color:#2d5a38;font-size:10px;font-weight:600;line-height:1.3;">17 типів<br>аналізу</span>
                            </td>
                            <td align="center" width="25%" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;padding:4px 2px;">
                              <span style="font-size:20px;display:block;padding-bottom:4px;">&#129302;</span>
                              <span style="color:#2d5a38;font-size:10px;font-weight:600;line-height:1.3;">AI Risk<br>Score</span>
                            </td>
                            <td align="center" width="25%" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;padding:4px 2px;">
                              <span style="font-size:20px;display:block;padding-bottom:4px;">&#128196;</span>
                              <span style="color:#2d5a38;font-size:10px;font-weight:600;line-height:1.3;">PDF<br>звіти</span>
                            </td>
                            <td align="center" width="25%" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;padding:4px 2px;">
                              <span style="font-size:20px;display:block;padding-bottom:4px;">&#128225;</span>
                              <span style="color:#2d5a38;font-size:10px;font-weight:600;line-height:1.3;">24/7<br>моніторинг</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ===== FOOTER ===== -->
              <tr>
                <td style="padding:8px 20px 40px;">
                  <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                    <!-- Divider -->
                    <tr><td style="height:1px;background-color:#0d2614;font-size:0;line-height:0;">&nbsp;</td></tr>
                    <tr>
                      <td style="padding-top:20px;text-align:center;font-family:'Segoe UI',Roboto,Arial,sans-serif;">

                        <!-- Links -->
                        <table role="presentation" align="center" style="border:none;border-spacing:0;margin:0 auto 14px;">
                          <tr>
                            <td style="padding:0 10px;"><a href="https://darkshare.store" style="color:#22c55e;text-decoration:none;font-size:12px;font-weight:600;">&#127760; Сайт</a></td>
                            <td style="color:#133a1c;font-size:10px;">&#9679;</td>
                            <td style="padding:0 10px;"><a href="https://t.me/DarkShare1Bot" style="color:#22c55e;text-decoration:none;font-size:12px;font-weight:600;">&#128172; Бот</a></td>
                            <td style="color:#133a1c;font-size:10px;">&#9679;</td>
                            <td style="padding:0 10px;"><a href="mailto:darkshare.store@gmail.com" style="color:#22c55e;text-decoration:none;font-size:12px;font-weight:600;">&#9993; Підтримка</a></td>
                          </tr>
                        </table>

                        <p style="color:#1a3d22;font-size:11px;margin:0 0 6px;">&copy; ${new Date().getFullYear()} DarkShare &mdash; Digital Risk Assessment Platform</p>
                        <p style="color:#0f2815;font-size:10px;margin:0;">Ви отримали цей лист, тому що зареєструвались на darkshare.store</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </div>
          <!--[if mso]></td></tr></table><![endif]-->

        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
