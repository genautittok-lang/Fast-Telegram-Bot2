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

const emailHeaders = {
  "List-Unsubscribe": "<mailto:darkshare.store@gmail.com?subject=unsubscribe>",
};

export async function sendEmailBroadcast(options: EmailBroadcastOptions): Promise<EmailResult> {
  const { to, subject, html } = options;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  const DELAY_MS = 350;
  const MAX_RETRIES = 2;

  for (let i = 0; i < to.length; i++) {
    const email = to[i];
    let success = false;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
          if (attempt < MAX_RETRIES && (error.message?.includes("rate") || error.message?.includes("limit") || error.message?.includes("429") || error.message?.includes("too many"))) {
            console.log(`[Email] Rate limited on ${email}, retry ${attempt + 1}/${MAX_RETRIES} after 2s...`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          failed++;
          errors.push(`${email}: ${error.message}`);
        } else {
          sent++;
          success = true;
        }
        break;
      } catch (err: any) {
        const msg = err.message || "Unknown error";
        if (attempt < MAX_RETRIES && (msg.includes("rate") || msg.includes("limit") || msg.includes("429") || msg.includes("too many") || msg.includes("ECONNRESET"))) {
          console.log(`[Email] Error on ${email}, retry ${attempt + 1}/${MAX_RETRIES} after 2s...`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        failed++;
        errors.push(`${email}: ${msg}`);
        break;
      }
    }

    if (i < to.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    if ((i + 1) % 50 === 0) {
      console.log(`[Email Broadcast] Progress: ${i + 1}/${to.length} (sent: ${sent}, failed: ${failed})`);
    }
  }

  console.log(`[Email Broadcast] Final: ${sent} sent, ${failed} failed out of ${to.length}. Errors: ${errors.length > 0 ? errors.slice(0, 10).join('; ') : 'none'}`);
  return { sent, failed, errors };
}

export function buildWelcomeHtml(username: string): string {
  const safeName = escapeHtml(username);
  return `<!DOCTYPE html>
<html lang="ru" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DarkShare</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#e0e0e0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:32px 20px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'Trebuchet MS','Segoe UI',Roboto,Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:2px;line-height:1;">
                    <span style="color:#22c55e;">DARK</span><span style="color:#ffffff;">SHARE</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <span style="display:inline-block;width:40px;height:2px;background-color:#22c55e;vertical-align:middle;"></span>
                    <span style="color:#4ade80;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:3px;vertical-align:middle;padding:0 8px;">v4.5</span>
                    <span style="display:inline-block;width:40px;height:2px;background-color:#22c55e;vertical-align:middle;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px;overflow:hidden;border:1px solid #1a2e1f;">
                <tr><td style="height:3px;background:linear-gradient(90deg,#22c55e,#16a34a);font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td style="background-color:#0d1711;padding:32px 28px;">
                    <p style="color:#f0fdf4;font-size:22px;font-weight:700;margin:0 0 16px;line-height:1.3;">&#127881; Добро пожаловать в DARKSHARE!</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                      <tr><td style="height:1px;background-color:#1a2e1f;font-size:0;">&nbsp;</td></tr>
                    </table>
                    <p style="color:#b8ccbe;font-size:15px;line-height:1.8;margin:0 0 16px;">Привет, <strong style="color:#f0fdf4;">${safeName}</strong>! &#128075;</p>
                    <p style="color:#b8ccbe;font-size:15px;line-height:1.8;margin:0 0 16px;">Ты теперь часть сообщества DARKSHARE — платформы цифровой разведки и кибербезопасности.</p>
                    <p style="color:#b8ccbe;font-size:15px;line-height:1.8;margin:0 0 16px;">&#127873; <strong style="color:#4ade80;">Твой приветственный бонус:</strong></p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#0d2818,#1a3a2a);border:2px dashed #22c55e;border-radius:12px;padding:20px;text-align:center;">
                          <p style="color:#4ade80;font-size:13px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Промокод на скидку 50%</p>
                          <p style="color:#ffffff;font-size:32px;font-weight:800;margin:0 0 8px;letter-spacing:4px;font-family:'Courier New',monospace;">DARKNEU</p>
                          <p style="color:#6ee7a0;font-size:12px;margin:0;">Используй при оплате любого тарифа</p>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#b8ccbe;font-size:15px;line-height:1.8;margin:0 0 8px;">&#128270; <strong style="color:#f0fdf4;">Что ты можешь проверить:</strong></p>
                    <p style="color:#9ab8a3;font-size:14px;line-height:2;margin:0 0 16px;">
                      &#128272; IP-адреса &bull; &#128176; Крипто-кошельки &bull; &#128231; Email<br>
                      &#128222; Телефоны &bull; &#127760; Домены &bull; &#128279; URL-ссылки<br>
                      &#128100; Юзернеймы &bull; &#128196; Хеши файлов &bull; &#128274; Пароли<br>
                      &#127760; DNS &bull; &#128274; SSL/TLS &bull; &#128225; MAC-адреса
                    </p>
                    <p style="color:#b8ccbe;font-size:15px;line-height:1.8;margin:0;">&#128640; Начни прямо сейчас — у тебя уже есть 5 бесплатных проверок!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48%" style="padding-right:6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#16a34a;border-radius:8px;">
                          <a href="https://darkshare.store" target="_blank" style="display:block;padding:12px 8px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;text-align:center;">&#127760; darkshare.store</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="48%" style="padding-left:6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border:1px solid #1a2e1f;border-radius:8px;background-color:#0d1711;">
                          <a href="https://t.me/DarkShare1Bot" target="_blank" style="display:block;padding:11px 8px;color:#4ade80;text-decoration:none;font-size:13px;font-weight:700;text-align:center;">&#128172; Telegram Bot</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px;background-color:#1a1a1a;font-size:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding-top:16px;">
                    <p style="color:#3a5a40;font-size:11px;margin:0 0 4px;">&copy; ${new Date().getFullYear()} DarkShare &mdash; Security Intelligence Platform</p>
                    <p style="color:#2a3a2e;font-size:10px;margin:0;">
                      <a href="mailto:darkshare.store@gmail.com" style="color:#3a5a40;text-decoration:none;">darkshare.store@gmail.com</a>
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

export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  try {
    const html = buildWelcomeHtml(username);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "🎉 Добро пожаловать в DARKSHARE! Твой бонус -50% внутри",
      html,
      headers: emailHeaders,
      replyTo: "darkshare.store@gmail.com",
    });
    if (error) {
      console.log(`[Welcome Email] Failed for ${email}: ${error.message}`);
      return false;
    }
    console.log(`[Welcome Email] Sent to ${email}`);
    return true;
  } catch (err: any) {
    console.log(`[Welcome Email] Error for ${email}: ${err.message}`);
    return false;
  }
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
<html lang="uk" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>DarkShare</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;color:#e0e0e0;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- LOGO HEADER -->
          <tr>
            <td align="center" style="padding:32px 20px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'Trebuchet MS','Segoe UI',Roboto,Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:2px;line-height:1;">
                    <span style="color:#22c55e;">DARK</span><span style="color:#ffffff;">SHARE</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <span style="display:inline-block;width:40px;height:2px;background-color:#22c55e;vertical-align:middle;"></span>
                    <span style="color:#4ade80;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:3px;font-family:'Segoe UI',Roboto,Arial,sans-serif;vertical-align:middle;padding:0 8px;">v4.5</span>
                    <span style="display:inline-block;width:40px;height:2px;background-color:#22c55e;vertical-align:middle;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT CARD -->
          <tr>
            <td style="padding:0 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px;overflow:hidden;border:1px solid #1a2e1f;">
                <!-- Green accent bar -->
                <tr><td style="height:3px;background:linear-gradient(90deg,#22c55e,#16a34a);font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td style="background-color:#0d1711;padding:32px 28px;">

                    <!-- Title -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom:20px;">
                          <p style="color:#f0fdf4;font-size:20px;font-weight:700;margin:0;line-height:1.4;font-family:'Segoe UI',Roboto,Arial,sans-serif;">${safeTitle}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                      <tr><td style="height:1px;background-color:#1a2e1f;font-size:0;">&nbsp;</td></tr>
                    </table>

                    <!-- Body -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="color:#b8ccbe;font-size:15px;line-height:1.8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                          ${safeBody}
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ACTION BUTTONS -->
          <tr>
            <td style="padding:20px 8px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Website button -->
                  <td width="48%" style="padding-right:6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#16a34a;border-radius:8px;">
                          <a href="https://darkshare.store" target="_blank" style="display:block;padding:12px 8px;color:#ffffff;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;">&#127760; darkshare.store</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Telegram button -->
                  <td width="48%" style="padding-left:6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border:1px solid #1a2e1f;border-radius:8px;background-color:#0d1711;">
                          <a href="https://t.me/DarkShare1Bot" target="_blank" style="display:block;padding:11px 8px;color:#4ade80;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;">&#128172; Telegram Bot</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- INSTAGRAM ROW -->
          <tr>
            <td style="padding:0 8px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border:1px solid #2a1520;border-radius:8px;background-color:#120a0e;">
                    <a href="https://www.instagram.com/darkshare.store" target="_blank" style="display:block;padding:11px 8px;color:#E4405F;text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;">&#128247; Instagram @darkshare.store</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:16px 20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px;background-color:#1a1a1a;font-size:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding-top:16px;">
                    <p style="color:#3a5a40;font-size:11px;margin:0 0 4px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">&copy; ${new Date().getFullYear()} DarkShare &mdash; Security Intelligence Platform</p>
                    <p style="color:#2a3a2e;font-size:10px;margin:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                      <a href="mailto:darkshare.store@gmail.com" style="color:#3a5a40;text-decoration:none;">darkshare.store@gmail.com</a>
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
