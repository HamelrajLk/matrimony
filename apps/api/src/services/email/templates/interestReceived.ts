import { baseTemplate } from '../baseTemplate';

export function interestReceived({ recipientName, senderAge, senderReligion, senderCountry, senderGender, profileUrl }: {
  recipientName: string; senderAge: number; senderReligion: string;
  senderCountry: string; senderGender: string; profileUrl: string;
}): { subject: string; html: string } {
  const genderLabel = senderGender === 'FEMALE' ? 'woman' : senderGender === 'MALE' ? 'man' : 'person';
  const body = `
    <p>Dear ${recipientName},</p>
    <p>Great news! Someone has expressed interest in your profile. 💕</p>
    <div style="background:#FFF0F8;border:1.5px solid #F4A43540;border-radius:16px;padding:24px;margin:20px 0;text-align:center;">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#F4A435,#E8735A);
                  margin:0 auto 16px;display:flex;align-items:center;justify-content:center;
                  font-size:32px;line-height:80px;">💕</div>
      <p style="margin:0;font-size:16px;font-weight:700;color:#2A1A1A;">
        A ${senderAge}-year-old ${senderReligion} ${genderLabel} from ${senderCountry}
      </p>
      <p style="margin:8px 0 0;font-size:14px;color:#7A6A5A;">has expressed interest in your profile</p>
    </div>
    <div style="background:#FFF8F0;border-radius:12px;padding:14px 18px;margin:16px 0;text-align:center;">
      <p style="margin:0;font-size:13px;color:#9A8A7A;">
        ⏰ You have <strong>7 days</strong> to view and respond to this interest.
      </p>
    </div>
    <p>Log in to see their full profile and decide if you'd like to connect. 🌸</p>
  `;
  return {
    subject: 'Someone is interested in your profile! 💕',
    html: baseTemplate({
      preheader: `A ${senderAge}-year-old from ${senderCountry} is interested in you!`,
      headline: 'You Have a New Interest! 💕',
      body,
      ctaText: 'View Profile & Respond →',
      ctaUrl: profileUrl,
    }),
  };
}
