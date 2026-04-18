import { baseTemplate } from '../baseTemplate';

export function interestDeclined({ recipientName, browseUrl }: {
  recipientName: string; browseUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p>Dear ${recipientName},</p>
    <p>Sometimes it's not the right fit — and that's perfectly okay. Every step brings you closer to the one who is meant for you. 🌸</p>
    <div style="background:#FFF8F0;border-radius:14px;padding:20px 24px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:15px;color:#7A6A5A;font-style:italic;line-height:1.7;">
        "Your perfect match is out there, waiting to find you.<br/>
        Keep your heart open." 💛
      </p>
    </div>
    <p>There are thousands of compatible profiles waiting for you. Why not explore a few today?</p>
  `;
  return {
    subject: 'Keep exploring — your match is out there 💛',
    html: baseTemplate({
      preheader: 'Keep your heart open. Your perfect match is waiting.',
      headline: 'Keep Exploring 💛',
      body,
      ctaText: 'Browse More Profiles →',
      ctaUrl: browseUrl,
    }),
  };
}
