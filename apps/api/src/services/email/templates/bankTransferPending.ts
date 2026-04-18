import { baseTemplate } from '../baseTemplate';

export function bankTransferPending({ name, planName, planColor, durationMonths, amount, currency, transferRef, dashboardUrl }: {
  name: string; planName: string; planColor: string; durationMonths: number;
  amount: number; currency: string; transferRef: string; dashboardUrl: string;
}): { subject: string; html: string } {
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
  const planIcon = planName === 'Gold' ? '✨' : planName === 'Diamond' ? '💎' : planName === 'Platinum' ? '👑' : '🌸';

  const body = `
    <p>Dear ${name},</p>
    <p>We've received your bank transfer details for the <strong style="color:${planColor};">${planIcon} ${planName}</strong> plan. Thank you! 🙏</p>

    <div style="background:#FFF8F0;border:1.5px solid #F4A43540;border-radius:16px;padding:24px;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9A8A7A;text-transform:uppercase;letter-spacing:1px;">Transfer Summary</p>
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
          <td style="padding:9px 0;color:#7A6A5A;font-size:13px;">Amount</td>
          <td style="text-align:right;font-weight:700;color:#2A1A1A;">${currencySymbol}${amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:#7A6A5A;font-size:13px;">Your Reference</td>
          <td style="text-align:right;font-size:12px;color:#9A8A7A;">${transferRef}</td>
        </tr>
      </table>
    </div>

    <div style="background:linear-gradient(135deg,#FFF8E8,#FFF3E0);border:1.5px solid #F4A43530;border-radius:14px;padding:18px 22px;margin:20px 0;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="font-size:1.4rem;">⏳</span>
        <span style="font-family:Georgia,serif;font-weight:700;font-size:15px;color:#2A1A1A;">Awaiting Verification</span>
      </div>
      <p style="margin:0;font-size:13px;color:#7A6A5A;line-height:1.65;">
        Our team will verify your payment within <strong>24 hours</strong> on business days.
        You'll receive a confirmation email with your receipt as soon as your
        <strong style="color:${planColor};">${planName}</strong> plan is activated.
      </p>
    </div>

    <p style="font-size:13px;color:#9A8A7A;line-height:1.6;">
      If you have any questions, please contact us at
      <a href="mailto:support@theweddingpartners.com" style="color:#F4A435;">support@theweddingpartners.com</a>
      and quote your transfer reference <strong>${transferRef}</strong>.
    </p>
  `;

  return {
    subject: `⏳ Bank transfer received — ${planName} plan pending activation`,
    html: baseTemplate({
      preheader: `We received your bank transfer for the ${planName} plan. Verification within 24 hours.`,
      headline: `Transfer Received! ${planIcon}`,
      body,
      ctaText: 'View Dashboard →',
      ctaUrl: dashboardUrl,
    }),
  };
}
