import { baseTemplate } from '../baseTemplate';

export function subscriptionReceipt({ name, planName, planColor, durationMonths, amount, currency, startDate, expiryDate, paymentRef, dashboardUrl }: {
  name: string; planName: string; planColor: string; durationMonths: number;
  amount: number; currency: string; startDate: string; expiryDate: string;
  paymentRef?: string; dashboardUrl: string;
}): { subject: string; html: string } {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
  const planIcon = planName === 'Gold' ? '✨' : planName === 'Diamond' ? '💎' : planName === 'Platinum' ? '👑' : '🌸';

  const body = `
    <p>Dear ${name},</p>
    <p>Thank you for your payment! Your <strong style="color:${planColor};">${planIcon} ${planName}</strong> subscription is now <strong style="color:#4ABEAA;">active</strong>. 🎉</p>
    <div style="background:#FFF8F0;border:1.5px solid #F4A43540;border-radius:16px;padding:24px;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9A8A7A;text-transform:uppercase;letter-spacing:1px;">Payment Receipt</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <tr style="border-bottom:1px solid #F5EDE6;">
          <td style="padding:9px 0;color:#7A6A5A;font-size:13px;">Plan</td>
          <td style="text-align:right;font-weight:700;color:${planColor};">${planIcon} ${planName}</td>
        </tr>
        <tr style="border-bottom:1px solid #F5EDE6;">
          <td style="padding:9px 0;color:#7A6A5A;font-size:13px;">Duration</td>
          <td style="text-align:right;font-weight:700;color:#2A1A1A;">${durationMonths} month${durationMonths > 1 ? 's' : ''}</td>
        </tr>
        <tr style="border-bottom:1px solid #F5EDE6;">
          <td style="padding:9px 0;color:#7A6A5A;font-size:13px;">Amount Paid</td>
          <td style="text-align:right;font-weight:700;color:#2A1A1A;">${currencySymbol}${amount.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid #F5EDE6;">
          <td style="padding:9px 0;color:#7A6A5A;font-size:13px;">Start Date</td>
          <td style="text-align:right;font-weight:600;color:#2A1A1A;">${startDate}</td>
        </tr>
        <tr style="${paymentRef ? 'border-bottom:1px solid #F5EDE6;' : ''}">
          <td style="padding:9px 0;color:#7A6A5A;font-size:13px;">Expiry Date</td>
          <td style="text-align:right;font-weight:600;color:#2A1A1A;">${expiryDate}</td>
        </tr>
        ${paymentRef ? `<tr><td style="padding:9px 0;color:#7A6A5A;font-size:13px;">Reference</td><td style="text-align:right;font-size:12px;color:#9A8A7A;">${paymentRef}</td></tr>` : ''}
      </table>
    </div>
    <div style="background:linear-gradient(135deg,${planColor}12,${planColor}06);border-radius:14px;padding:16px 20px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:#2A1A1A;font-weight:700;">Your premium benefits are now unlocked! 🚀</p>
      <p style="margin:6px 0 0;font-size:12px;color:#7A6A5A;">Log in to explore everything your ${planName} plan has to offer.</p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">Keep this email as your payment receipt. For any issues, contact <a href="mailto:support@theweddingpartners.com" style="color:#F4A435;">support@theweddingpartners.com</a></p>
  `;
  return {
    subject: `✅ Payment confirmed — ${planName} plan activated`,
    html: baseTemplate({
      preheader: `Your ${planName} subscription is active until ${expiryDate}.`,
      headline: `${planIcon} ${planName} Plan Activated!`,
      body,
      ctaText: 'Explore Premium Features →',
      ctaUrl: dashboardUrl,
    }),
  };
}
