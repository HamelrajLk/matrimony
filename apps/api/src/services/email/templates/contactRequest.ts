import { baseTemplate } from '../baseTemplate';

export function contactRequest({ recipientName, requesterFirstName, requesterAge, requesterCountry, message, profileUrl }: {
  recipientName: string; requesterFirstName: string; requesterAge: number;
  requesterCountry: string; message?: string; profileUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p>Dear ${recipientName},</p>
    <p><strong>${requesterFirstName}</strong> (${requesterAge} yrs, ${requesterCountry}) has requested your contact details. 📞</p>
    ${message ? `
    <div style="background:#FFF8F0;border-left:4px solid #F4A435;border-radius:0 12px 12px 0;padding:14px 18px;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9A8A7A;text-transform:uppercase;">Their message:</p>
      <p style="margin:0;font-size:14px;color:#2A1A1A;font-style:italic;">"${message}"</p>
    </div>` : ''}
    <p>Log in to view their profile and decide whether to share your contact information. All sharing is within your control.</p>
    <p style="font-size:13px;color:#9A8A7A;">
      🔒 Your contact details are never shared without your explicit approval.
    </p>
  `;
  return {
    subject: `📞 ${requesterFirstName} has requested your contact details`,
    html: baseTemplate({
      preheader: `${requesterFirstName} from ${requesterCountry} wants to connect with you directly.`,
      headline: `Contact Request from ${requesterFirstName} 📞`,
      body,
      ctaText: 'View & Respond →',
      ctaUrl: profileUrl,
    }),
  };
}
