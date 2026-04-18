import { baseTemplate } from '../baseTemplate';

export function unreadMessagesDigest({ recipientName, unreadCount, senders, inboxUrl }: {
  recipientName: string; unreadCount: number; senders: string[]; inboxUrl: string;
}): { subject: string; html: string } {
  const senderText = senders.length === 0 ? 'several people'
    : senders.length === 1 ? senders[0]
    : senders.length === 2 ? `${senders[0]} and ${senders[1]}`
    : `${senders.slice(0, 2).join(', ')} and ${unreadCount - 2} others`;

  const body = `
    <p>Dear ${recipientName},</p>
    <p>You have <strong>${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}</strong> waiting for you in your inbox. 📩</p>
    <div style="background:#FFF0F8;border-radius:14px;padding:20px 24px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:16px;color:#2A1A1A;">
        Messages from: <strong>${senderText}</strong>
      </p>
    </div>
    <p style="font-size:13px;color:#9A8A7A;">
      Replying promptly shows you're a serious, respectful match-seeker. 🌸
    </p>
  `;
  return {
    subject: `You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''} waiting`,
    html: baseTemplate({
      preheader: `${unreadCount} unread messages from ${senderText}`,
      headline: `${unreadCount} Messages Waiting 📩`,
      body,
      ctaText: 'Open Your Inbox →',
      ctaUrl: inboxUrl,
    }),
  };
}
