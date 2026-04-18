/**
 * Backwards-compat shim — all logic has moved to services/email/
 * Existing imports (auth.controller, profile.controller) continue to work.
 */
import { sendEmail, verificationOTP, passwordReset, welcome } from './email';

export async function sendWelcomeEmail(to: string, name: string, _role: string) {
  const { subject, html } = welcome({
    name,
    profileUrl: `${process.env.CLIENT_URL}/dashboard/profile`,
  });
  await sendEmail({ to, subject, html });
}

export async function sendVerificationOtp(to: string, otp: string, name = 'there') {
  const { subject, html } = verificationOTP({ name, otp, expiresInMinutes: 10 });
  await sendEmail({ to, subject, html });
}

export async function sendProfileViewEmail(
  to: string, viewedName: string, viewerName: string, profileLink: string,
) {
  // Inline — no dedicated template needed for this simple notification
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#FFFBF7;padding:40px;border-radius:16px;">
      <h2 style="font-family:Georgia,serif;color:#E8735A;">Someone viewed your profile! 👀</h2>
      <p>Hi <strong>${viewedName}</strong>,</p>
      <p><strong style="color:#E8735A;">${viewerName}</strong> just viewed your profile on The Wedding Partners.</p>
      <a href="${profileLink}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:#F4A435;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;">
        View Your Profile →
      </a>
    </div>`;
  await sendEmail({ to, subject: `👀 ${viewerName} viewed your profile`, html });
}

export async function sendPasswordResetEmail(to: string, name: string, resetLink: string) {
  const { subject, html } = passwordReset({ name, resetUrl: resetLink });
  await sendEmail({ to, subject, html });
}
