import { baseTemplate } from '../baseTemplate';

export function welcome({ name, profileUrl, gender }: {
  name: string; profileUrl: string; gender?: string;
}): { subject: string; html: string } {
  const greeting = gender === 'FEMALE' ? 'sister' : gender === 'MALE' ? 'brother' : 'friend';
  const body = `
    <p>Dear ${name},</p>
    <p>Welcome to <strong>The Wedding Partners</strong> — Sri Lanka's most trusted matrimony platform.
       You've joined thousands of Sri Lankans worldwide who have found their perfect life partner here.</p>
    <p>To get the best matches, complete your profile in 3 easy steps:</p>
    <div style="background:#FFF8F0;border-radius:14px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 10px;font-weight:700;color:#2A1A1A;">Your Profile Checklist</p>
      <p style="margin:6px 0;">☐ &nbsp;<strong>Add your photo</strong> — profiles with photos get 10× more responses</p>
      <p style="margin:6px 0;">☐ &nbsp;<strong>Complete your horoscope details</strong> — important for many Sri Lankan families</p>
      <p style="margin:6px 0;">☐ &nbsp;<strong>Set your partner preferences</strong> — help us find your perfect match</p>
    </div>
    <p>We are honoured to be part of your journey, dear ${greeting}. 🌸</p>
  `;
  return {
    subject: `Welcome to The Wedding Partners, ${name}! 💍`,
    html: baseTemplate({
      preheader: `Welcome, ${name}! Complete your profile to start finding your perfect match.`,
      headline: `Welcome, ${name}! 💕`,
      body,
      ctaText: 'Complete Your Profile →',
      ctaUrl: profileUrl,
      footerNote: 'You are receiving this email because you just created an account with The Wedding Partners.',
    }),
  };
}
