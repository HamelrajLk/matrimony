import { baseTemplate } from '../baseTemplate';

export function newMessageAlert({ recipientName, senderFirstName, messagePreview, chatUrl }: {
  recipientName: string; senderFirstName: string;
  messagePreview: string; chatUrl: string;
}): { subject: string; html: string } {
  const preview = messagePreview.length > 60
    ? messagePreview.slice(0, 60) + '…'
    : messagePreview;
  const body = `
    <p>Dear ${recipientName},</p>
    <p><strong>${senderFirstName}</strong> sent you a message on The Wedding Partners. 💬</p>
    <div style="background:#FFF8F0;border-left:4px solid #F4A435;border-radius:0 12px 12px 0;
                padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9A8A7A;text-transform:uppercase;letter-spacing:1px;">
        ${senderFirstName} says:
      </p>
      <p style="margin:0;font-size:15px;color:#2A1A1A;font-style:italic;">"${preview}"</p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">Don't leave them waiting — reply now! 😊</p>
  `;
  return {
    subject: `New message from ${senderFirstName}`,
    html: baseTemplate({
      preheader: `${senderFirstName}: "${preview}"`,
      headline: `New Message from ${senderFirstName} 💬`,
      body,
      ctaText: 'Reply Now →',
      ctaUrl: chatUrl,
    }),
  };
}
