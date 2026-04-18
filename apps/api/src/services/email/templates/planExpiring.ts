import { baseTemplate } from '../baseTemplate';

export function planExpiring({ name, planName, daysLeft, expiryDate, renewUrl }: {
  name: string; planName: string; daysLeft: number; expiryDate: string; renewUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p>Dear ${name},</p>
    <p>Your <strong>${planName}</strong> membership expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> on <strong>${expiryDate}</strong>.</p>
    <div style="background:#FFF8F0;border:1.5px solid #F4A43560;border-radius:14px;padding:18px 22px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:#7A6A5A;">⏰ Don't lose your premium benefits!</p>
      <p style="margin:8px 0 0;font-size:13px;color:#9A8A7A;">Renew now to keep unlimited messaging, advanced search, and more.</p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">
      Renewing early locks in your current price and keeps your match journey uninterrupted. 🌸
    </p>
  `;
  return {
    subject: `⚠️ Your ${planName} plan expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html: baseTemplate({
      preheader: `Your ${planName} membership expires on ${expiryDate}. Renew now.`,
      headline: `Your Plan is Expiring Soon ⏰`,
      body,
      ctaText: 'Renew Now →',
      ctaUrl: renewUrl,
    }),
  };
}
