import { baseTemplate } from '../baseTemplate';

export function interestAccepted({ recipientName, acceptorFirstName, acceptorAge, acceptorCountry, chatUrl }: {
  recipientName: string; acceptorFirstName: string;
  acceptorAge: number; acceptorCountry: string; chatUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p>Dear ${recipientName},</p>
    <p>Wonderful news — <strong>${acceptorFirstName}</strong> has accepted your interest! 🎉</p>
    <div style="background:linear-gradient(135deg,#FFF0F8,#FFF8F2);border:1.5px solid #F4A43540;
                border-radius:16px;padding:28px;margin:20px 0;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">💑</div>
      <p style="margin:0;font-size:18px;font-weight:700;color:#E8735A;">${acceptorFirstName}</p>
      <p style="margin:6px 0 0;font-size:14px;color:#7A6A5A;">${acceptorAge} years old · ${acceptorCountry}</p>
    </div>
    <p style="text-align:center;font-weight:600;color:#2A1A1A;">
      You can now message each other directly. 💬
    </p>
    <p style="font-size:13px;color:#9A8A7A;text-align:center;">
      This is just the beginning of your journey together. May it be filled with love and happiness! 🌸
    </p>
  `;
  return {
    subject: `🎉 ${acceptorFirstName} accepted your interest!`,
    html: baseTemplate({
      preheader: `${acceptorFirstName} accepted your interest! You can now message each other.`,
      headline: `${acceptorFirstName} Said Yes! 🎉`,
      body,
      ctaText: 'Start Chatting →',
      ctaUrl: chatUrl,
    }),
  };
}
