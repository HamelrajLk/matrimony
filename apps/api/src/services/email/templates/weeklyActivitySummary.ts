import { baseTemplate } from '../baseTemplate';

interface TopMatch { age: number; religion: string; country: string; profileUrl: string; }
interface Stats {
  profileViews: number; interestsSent: number; interestsReceived: number;
  messagesReceived: number; newMatches: number;
}

export function weeklyActivitySummary({ recipientName, stats, topMatch, dashboardUrl }: {
  recipientName: string; stats: Stats; topMatch: TopMatch | null; dashboardUrl: string;
}): { subject: string; html: string } {
  const statRow = (icon: string, label: string, value: number) =>
    `<tr>
       <td style="padding:10px 0;color:#4A3A2A;font-size:14px;">${icon} &nbsp;${label}</td>
       <td style="padding:10px 0;text-align:right;font-weight:700;font-size:16px;color:#E8735A;">${value}</td>
     </tr>`;

  const topMatchBlock = topMatch ? `
    <div style="background:#FFF0F8;border-radius:14px;padding:18px 22px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#9A8A7A;text-transform:uppercase;letter-spacing:1px;">
        ✨ Your Top Match This Week
      </p>
      <p style="margin:0;font-weight:700;color:#2A1A1A;font-size:15px;">
        ${topMatch.age} yrs · ${topMatch.religion} · ${topMatch.country}
      </p>
      <a href="${topMatch.profileUrl}"
         style="display:inline-block;margin-top:10px;padding:8px 20px;background:#F4A435;
                color:#fff;border-radius:50px;text-decoration:none;font-size:13px;font-weight:700;">
        View Profile →
      </a>
    </div>
  ` : '';

  const body = `
    <p>Dear ${recipientName},</p>
    <p>Here's a summary of your activity on The Wedding Partners this week. 📊</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:14px;overflow:hidden;background:#FFF8F0;">
      <tbody style="padding:0 20px;">
        ${statRow('👁️', 'Profile Views', stats.profileViews)}
        ${statRow('💌', 'Interests Received', stats.interestsReceived)}
        ${statRow('📤', 'Interests Sent', stats.interestsSent)}
        ${statRow('💬', 'Messages Received', stats.messagesReceived)}
        ${statRow('✨', 'New Matches', stats.newMatches)}
      </tbody>
    </table>
    ${topMatchBlock}
    <p style="font-size:13px;color:#9A8A7A;">Keep engaging — the more active you are, the better your matches get! 🌸</p>
  `;
  return {
    subject: `Your weekly activity summary — The Wedding Partners`,
    html: baseTemplate({
      preheader: `${stats.profileViews} views, ${stats.interestsReceived} interests this week.`,
      headline: `Your Weekly Summary 📊`,
      body,
      ctaText: 'Go to Dashboard →',
      ctaUrl: dashboardUrl,
    }),
  };
}
