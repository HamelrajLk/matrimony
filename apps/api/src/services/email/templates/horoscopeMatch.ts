import { baseTemplate } from '../baseTemplate';

export function horoscopeMatch({ recipientName, matchName, matchAge, matchCountry, compatibilityScore, profileUrl }: {
  recipientName: string; matchName?: string; matchAge: number;
  matchCountry: string; compatibilityScore: number; profileUrl: string;
}): { subject: string; html: string } {
  const scoreColor = compatibilityScore >= 80 ? '#4ABEAA' : compatibilityScore >= 60 ? '#F4A435' : '#E8735A';
  const scoreLabel = compatibilityScore >= 80 ? 'Excellent Match' : compatibilityScore >= 60 ? 'Good Match' : 'Moderate Match';
  const body = `
    <p>Dear ${recipientName},</p>
    <p>We've found a profile with a strong astrological compatibility with yours. ⭐</p>
    <div style="background:linear-gradient(135deg,#FFF8F2,#FFF0E8);border:1.5px solid #F4A43540;
                border-radius:16px;padding:24px;margin:20px 0;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🌟</div>
      <p style="margin:0;font-size:14px;color:#7A6A5A;">${matchAge} yrs · ${matchCountry}</p>
      <div style="margin:16px auto;width:80px;height:80px;border-radius:50%;
                  background:conic-gradient(${scoreColor} ${compatibilityScore}%, #F0E8E0 0);
                  display:flex;align-items:center;justify-content:center;">
        <div style="width:60px;height:60px;border-radius:50%;background:#fff;
                    display:flex;align-items:center;justify-content:center;
                    font-weight:800;font-size:18px;color:${scoreColor};">
          ${compatibilityScore}%
        </div>
      </div>
      <p style="margin:0;font-weight:700;color:${scoreColor};font-size:16px;">${scoreLabel}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#9A8A7A;">Horoscope Compatibility Score</p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">
      This score is based on traditional Sri Lankan Jathaka Porondam analysis.
      Log in to view the full compatibility report and their profile.
    </p>
  `;
  return {
    subject: `🌟 A ${compatibilityScore}% horoscope match found for you!`,
    html: baseTemplate({
      preheader: `We found a ${compatibilityScore}% astrological match for you.`,
      headline: `A Star-Aligned Match for You 🌟`,
      body,
      ctaText: 'View This Match →',
      ctaUrl: profileUrl,
    }),
  };
}
