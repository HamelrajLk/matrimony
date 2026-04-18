export interface BaseTemplateOptions {
  preheader: string;
  headline: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

const CLIENT_URL = process.env.CLIENT_URL || 'https://theweddingpartners.com';

export function baseTemplate({
  preheader,
  headline,
  body,
  ctaText,
  ctaUrl,
  footerNote,
}: BaseTemplateOptions): string {
  const cta =
    ctaText && ctaUrl
      ? `<div style="text-align:center;margin:32px 0;">
           <a href="${ctaUrl}"
              style="display:inline-block;padding:14px 36px;background:#F4A435;color:#ffffff;
                     border-radius:50px;text-decoration:none;font-family:Arial,sans-serif;
                     font-weight:700;font-size:16px;letter-spacing:0.3px;">
             ${ctaText}
           </a>
         </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${headline}</title>
  <style>
    body { margin:0; padding:0; background:#F5EDE6; font-family:Arial,sans-serif; }
    .wrapper { background:#F5EDE6; padding:32px 16px; }
    .card    { background:#FFFBF7; max-width:600px; margin:0 auto; border-radius:20px;
               overflow:hidden; box-shadow:0 4px 24px rgba(244,164,53,0.10); }
    .header  { background:linear-gradient(135deg,#FFF8F2,#FDEEE0);
               padding:28px 40px 24px; text-align:center;
               border-bottom:2px solid #F4A43530; }
    .logo-icon { font-size:32px; margin-bottom:4px; }
    .logo-text { font-family:Georgia,'Times New Roman',serif; font-size:22px;
                 font-weight:700; color:#2A1A1A; letter-spacing:0.5px; }
    .logo-sub  { font-family:Arial,sans-serif; font-size:11px; color:#9A8A7A;
                 letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
    .body    { padding:36px 40px 28px; }
    h1       { font-family:Georgia,'Times New Roman',serif; font-size:26px;
               color:#2A1A1A; margin:0 0 16px; line-height:1.35; font-weight:700; }
    p        { color:#4A3A2A; font-size:15px; line-height:1.7; margin:0 0 14px; }
    .footer  { background:#FFF0E6; padding:24px 40px; text-align:center;
               border-top:1px solid #F0E0D0; }
    .footer p { color:#9A8A7A; font-size:12px; line-height:1.6; margin:0 0 6px; }
    .footer a { color:#F4A435; text-decoration:none; }
    @media (max-width:600px) {
      .body, .header, .footer { padding-left:20px !important; padding-right:20px !important; }
      h1 { font-size:22px !important; }
    }
  </style>
</head>
<body>
  <!-- preheader hidden preview text -->
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>

  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <div class="logo-icon">♥</div>
        <div class="logo-text">The Wedding Partners</div>
        <div class="logo-sub">Sri Lanka's #1 Matrimony Platform</div>
      </div>

      <!-- Body -->
      <div class="body">
        <h1>${headline}</h1>
        ${body}
        ${cta}
        ${footerNote ? `<p style="font-size:13px;color:#9A8A7A;margin-top:24px;">${footerNote}</p>` : ''}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>
          <a href="${CLIENT_URL}/dashboard">Dashboard</a> &nbsp;·&nbsp;
          <a href="${CLIENT_URL}/dashboard/profile">My Profile</a> &nbsp;·&nbsp;
          <a href="mailto:support@theweddingpartners.com">Support</a>
        </p>
        <p>
          <a href="${CLIENT_URL}/unsubscribe">Unsubscribe</a> from email notifications
        </p>
        <p style="margin-top:10px;">
          © ${new Date().getFullYear()} The Wedding Partners (Pvt) Ltd · Colombo, Sri Lanka
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
