import { baseTemplate } from '../baseTemplate';

export function planExpired({ name, planName, renewUrl }: {
  name: string; planName: string; renewUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p>Dear ${name},</p>
    <p>Your <strong>${planName}</strong> membership has expired. You have been moved back to the Free plan.</p>
    <div style="background:#FFF8F0;border-radius:14px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 10px;font-weight:700;color:#2A1A1A;">Features you no longer have access to:</p>
      <p style="margin:5px 0;color:#9A8A7A;">❌ &nbsp;Unlimited messaging</p>
      <p style="margin:5px 0;color:#9A8A7A;">❌ &nbsp;Advanced search filters</p>
      <p style="margin:5px 0;color:#9A8A7A;">❌ &nbsp;Contact details of matches</p>
      <p style="margin:5px 0;color:#9A8A7A;">❌ &nbsp;Profile highlight & boost</p>
    </div>
    <p>Your profile remains active and visible. Renew anytime to restore your premium access. 💛</p>
  `;
  return {
    subject: `Your ${planName} plan has expired — renew to keep connecting`,
    html: baseTemplate({
      preheader: `Your ${planName} membership has expired. Renew to restore premium features.`,
      headline: `Your ${planName} Plan Has Expired`,
      body,
      ctaText: 'Renew Membership →',
      ctaUrl: renewUrl,
    }),
  };
}
