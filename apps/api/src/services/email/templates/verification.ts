import { baseTemplate } from '../baseTemplate';

export function verificationOTP({ name, otp, expiresInMinutes = 15 }: {
  name: string; otp: string; expiresInMinutes?: number;
}): { subject: string; html: string } {
  const body = `
    <p>Hi ${name},</p>
    <p>Use the code below to verify your email address. It expires in <strong>${expiresInMinutes} minutes</strong>.</p>
    <div style="text-align:center;margin:28px auto;">
      <div style="display:inline-block;background:linear-gradient(135deg,#FFF0E6,#FFFBF7);
                  border:2px dashed #F4A435;border-radius:16px;padding:24px 40px;">
        <span style="font-family:Georgia,serif;font-size:48px;font-weight:800;
                     color:#E8735A;letter-spacing:10px;">${otp}</span>
      </div>
    </div>
    <p style="text-align:center;font-size:13px;color:#9A8A7A;">
      This code expires in ${expiresInMinutes} minutes.
    </p>
    <div style="background:#FFF8F0;border-left:4px solid #F4A435;border-radius:0 10px 10px 0;
                padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#7A6A5A;">
        🔒 <strong>Never share this code with anyone.</strong>
        The Wedding Partners team will never ask for your verification code.
      </p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">
      If you didn't create an account with us, you can safely ignore this email.
    </p>
  `;
  return {
    subject: `Your verification code: ${otp}`,
    html: baseTemplate({
      preheader: `Your verification code is ${otp}. Expires in ${expiresInMinutes} minutes.`,
      headline: 'Verify Your Email Address',
      body,
    }),
  };
}
