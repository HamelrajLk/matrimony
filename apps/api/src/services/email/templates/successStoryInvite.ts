import { baseTemplate } from '../baseTemplate';

export function successStoryInvite({ name, submitUrl }: {
  name: string; submitUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p>Dear ${name},</p>
    <p>Congratulations on finding your life partner through The Wedding Partners! 🎊</p>
    <p>Your love story could inspire thousands of others who are still on their journey.
       Would you like to share how you met? It takes just 2 minutes.</p>
    <div style="background:linear-gradient(135deg,#FFF0F8,#FFF8F2);border-radius:16px;padding:24px;margin:20px 0;text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">💍</div>
      <p style="margin:0;font-size:15px;color:#2A1A1A;font-weight:700;">Share Your Success Story</p>
      <p style="margin:8px 0 0;font-size:13px;color:#7A6A5A;line-height:1.65;">
        Your story will be featured on our website (with your permission)<br/>
        and will give hope to other families searching for their perfect match.
      </p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">
      We wish you and your partner a lifetime of love, happiness, and prosperity. 🌸
    </p>
  `;
  return {
    subject: `💍 Share your success story with The Wedding Partners`,
    html: baseTemplate({
      preheader: `Congratulations! Share your love story and inspire others.`,
      headline: `Congratulations, ${name}! 💍`,
      body,
      ctaText: 'Share Our Story →',
      ctaUrl: submitUrl,
    }),
  };
}
