import { baseTemplate } from '../baseTemplate';

export function inactiveReminder({ recipientName, daysSinceLogin, pendingInterestsCount, profileViewsCount, loginUrl }: {
  recipientName: string; daysSinceLogin: number;
  pendingInterestsCount: number; profileViewsCount: number; loginUrl: string;
}): { subject: string; html: string } {
  const is30Day = daysSinceLogin >= 30;
  const subject = is30Day
    ? 'Come back — people want to connect with you 💛'
    : `You've been missed, ${recipientName}! 💛`;

  const body = `
    <p>Dear ${recipientName},</p>
    <p>${is30Day
      ? "It's been a while since we've seen you. People on The Wedding Partners are still looking for someone just like you."
      : `We haven't seen you in ${daysSinceLogin} days and wanted to check in. Your match might be waiting!`
    }</p>
    <div style="background:#FFF8F0;border-radius:14px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 12px;font-weight:700;color:#2A1A1A;">While you were away:</p>
      <p style="margin:6px 0;">👁️ &nbsp;<strong>${profileViewsCount}</strong> people viewed your profile</p>
      <p style="margin:6px 0;">💌 &nbsp;<strong>${pendingInterestsCount}</strong> people expressed interest in you</p>
      <p style="margin:6px 0;">✨ &nbsp;New compatible profiles were added daily</p>
    </div>
    <p>Your future partner could be one click away. Come back and see who's waiting for you! 💕</p>
  `;
  return {
    subject,
    html: baseTemplate({
      preheader: `${profileViewsCount} people viewed your profile while you were away.`,
      headline: `We've Missed You, ${recipientName}! 💛`,
      body,
      ctaText: 'Log In Now →',
      ctaUrl: loginUrl,
    }),
  };
}
