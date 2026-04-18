import { baseTemplate } from '../baseTemplate';

export function matchmakerContact({ recipientName, matchmakerName, matchmakerPhone, message, profileUrl }: {
  recipientName: string; matchmakerName: string;
  matchmakerPhone?: string; message: string; profileUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p>Dear ${recipientName},</p>
    <p>A registered matchmaker on The Wedding Partners has reached out to you regarding a potential match. 💍</p>
    <div style="background:#FFF8F0;border:1.5px solid #F4A43540;border-radius:16px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:700;color:#2A1A1A;">From Matchmaker: ${matchmakerName}</p>
      ${matchmakerPhone ? `<p style="margin:0 0 12px;font-size:13px;color:#7A6A5A;">📞 ${matchmakerPhone}</p>` : ''}
      <p style="margin:0;font-size:14px;color:#4A3A2A;font-style:italic;line-height:1.7;">"${message}"</p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">
      All matchmakers on our platform are verified professionals.
      You can view and respond to this contact through your dashboard.
    </p>
  `;
  return {
    subject: `💍 A matchmaker wants to connect you with a potential match`,
    html: baseTemplate({
      preheader: `${matchmakerName} has a potential match for you.`,
      headline: `A Matchmaker Has a Match for You 💍`,
      body,
      ctaText: 'View & Respond →',
      ctaUrl: profileUrl,
    }),
  };
}
