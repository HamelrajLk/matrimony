import { baseTemplate } from '../baseTemplate';

export function profileApproved({ name, profileUrl, referenceId }: {
  name: string; profileUrl: string; referenceId: string;
}): { subject: string; html: string } {
  const body = `
    <p>Congratulations, ${name}! 🎉</p>
    <p>Your profile has been reviewed and is now <strong>live</strong> on The Wedding Partners.
       Potential matches can now find and view your profile.</p>
    <div style="background:#E8F8F5;border-radius:14px;padding:20px 24px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#4A8A7A;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
        Your Reference ID
      </p>
      <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:800;color:#2A1A1A;letter-spacing:3px;">
        ${referenceId}
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#7A8A7A;">Share this ID with your family and matchmaker</p>
    </div>
    <p><strong>Tips to get more matches:</strong></p>
    <p style="margin:6px 0;">📸 &nbsp;Profiles with photos get <strong>10× more responses</strong></p>
    <p style="margin:6px 0;">✅ &nbsp;A complete profile builds trust with families</p>
    <p style="margin:6px 0;">🌟 &nbsp;Add your horoscope details to unlock astrology matching</p>
  `;
  return {
    subject: '✅ Your profile is now live!',
    html: baseTemplate({
      preheader: `Your profile is live! Your reference ID is ${referenceId}.`,
      headline: '🎉 Your Profile is Live!',
      body,
      ctaText: 'View Your Profile →',
      ctaUrl: profileUrl,
    }),
  };
}
