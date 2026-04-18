import { baseTemplate } from '../baseTemplate';

export function profileIncomplete({ name, missingFields, profileUrl }: {
  name: string; missingFields: string[]; profileUrl: string;
}): { subject: string; html: string } {
  const fieldItems = missingFields
    .map(f => `<p style="margin:6px 0;">☐ &nbsp;${f}</p>`)
    .join('');
  const body = `
    <p>Hi ${name},</p>
    <p>Your profile is looking great! Just a few more details and you'll be ready to connect with your perfect match. 😊</p>
    <div style="background:#FFF8F0;border-radius:14px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 12px;font-weight:700;color:#2A1A1A;">Still to complete:</p>
      ${fieldItems}
    </div>
    <div style="background:#F0FDF8;border-radius:14px;padding:16px 20px;margin:16px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:#2A6A5A;">
        💡 Complete profiles get <strong>3× more matches</strong> than incomplete ones.
      </p>
    </div>
    <p>No rush — take your time. We're here whenever you're ready. 🌸</p>
  `;
  return {
    subject: `Your profile is almost ready, ${name}!`,
    html: baseTemplate({
      preheader: `Just a few more details and you'll be ready to find your perfect match.`,
      headline: `Almost There, ${name}! 🌸`,
      body,
      ctaText: 'Complete Profile →',
      ctaUrl: profileUrl,
    }),
  };
}
