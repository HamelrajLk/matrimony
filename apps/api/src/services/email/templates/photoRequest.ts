import { baseTemplate } from '../baseTemplate';

export function photoRequest({ recipientName, requesterFirstName, requesterAge, requesterCountry, profileUrl }: {
  recipientName: string; requesterFirstName: string;
  requesterAge: number; requesterCountry: string; profileUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p>Dear ${recipientName},</p>
    <p><strong>${requesterFirstName}</strong> (${requesterAge} yrs, ${requesterCountry}) has requested to see your photos. 📸</p>
    <div style="background:#FFF8F0;border-radius:14px;padding:18px 22px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:#7A6A5A;line-height:1.65;">
        They are interested in your profile and would love to see your photos.<br/>
        Sharing a photo increases your chances of connecting by <strong>10×</strong>.
      </p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">
      You can upload or share your photos privately from your profile settings.
      Your photos are only visible to members you approve.
    </p>
  `;
  return {
    subject: `📸 ${requesterFirstName} would like to see your photos`,
    html: baseTemplate({
      preheader: `${requesterFirstName} from ${requesterCountry} has requested to see your photos.`,
      headline: `A Photo Request from ${requesterFirstName} 📸`,
      body,
      ctaText: 'Manage My Photos →',
      ctaUrl: profileUrl,
    }),
  };
}
