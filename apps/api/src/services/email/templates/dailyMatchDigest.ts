import { baseTemplate } from '../baseTemplate';

interface MatchCard {
  age: number; religion: string; country: string;
  profileUrl: string; isPhotoVisible: boolean; photoUrl?: string;
}

export function dailyMatchDigest({ recipientName, matches, totalNewToday, allMatchesUrl }: {
  recipientName: string; matches: MatchCard[];
  totalNewToday: number; allMatchesUrl: string;
}): { subject: string; html: string } {
  const cards = matches.slice(0, 3).map(m => `
    <div style="display:inline-block;width:160px;vertical-align:top;margin:8px;
                background:#fff;border-radius:16px;border:1.5px solid #F0E8E0;
                overflow:hidden;text-align:center;">
      <div style="width:100%;height:100px;background:linear-gradient(135deg,#F4A43520,#E8735A20);
                  display:flex;align-items:center;justify-content:center;font-size:32px;">
        ${m.isPhotoVisible && m.photoUrl
          ? `<img src="${m.photoUrl}" style="width:100%;height:100%;object-fit:cover;" alt="" />`
          : '💕'}
      </div>
      <div style="padding:12px 10px;">
        <p style="margin:0;font-weight:700;color:#2A1A1A;font-size:14px;">${m.age} yrs</p>
        <p style="margin:3px 0;font-size:12px;color:#7A6A5A;">${m.religion} · ${m.country}</p>
        <a href="${m.profileUrl}"
           style="display:inline-block;margin-top:8px;padding:6px 14px;background:#F4A435;
                  color:#fff;border-radius:50px;text-decoration:none;font-size:12px;font-weight:700;">
          View →
        </a>
      </div>
    </div>
  `).join('');

  const body = `
    <p>Dear ${recipientName},</p>
    <p>We found <strong>${totalNewToday} new profile${totalNewToday !== 1 ? 's' : ''}</strong> that match your preferences today! ✨</p>
    <div style="text-align:center;margin:24px 0;">
      ${cards}
    </div>
    <p style="text-align:center;font-size:13px;color:#9A8A7A;">
      ${totalNewToday > 3 ? `And ${totalNewToday - 3} more waiting for you…` : 'Check them out before someone else does! 😊'}
    </p>
  `;
  return {
    subject: `✨ ${totalNewToday} new profile${totalNewToday !== 1 ? 's' : ''} match you today`,
    html: baseTemplate({
      preheader: `${totalNewToday} new compatible profiles found for you today.`,
      headline: `Your Daily Matches ✨`,
      body,
      ctaText: `View All ${totalNewToday} Matches →`,
      ctaUrl: allMatchesUrl,
    }),
  };
}
