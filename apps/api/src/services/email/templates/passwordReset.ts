import { baseTemplate } from '../baseTemplate';

export function passwordReset({ name, resetUrl, expiresInHours = 1 }: {
  name: string; resetUrl: string; expiresInHours?: number;
}): { subject: string; html: string } {
  const body = `
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new password.</p>
    <div style="background:#FFF8F0;border-left:4px solid #E8735A;border-radius:0 10px 10px 0;
                padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#7A6A5A;">
        ⏰ This link expires in <strong>${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}</strong>.
      </p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;margin-top:24px;">
      🔒 If you didn't request a password reset, you can safely ignore this email.
      Your account remains secure.
    </p>
  `;
  return {
    subject: 'Reset your password — The Wedding Partners',
    html: baseTemplate({
      preheader: 'Reset your password. This link expires in 1 hour.',
      headline: 'Password Reset Request 🔑',
      body,
      ctaText: 'Reset My Password →',
      ctaUrl: resetUrl,
    }),
  };
}
