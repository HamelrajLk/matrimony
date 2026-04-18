import { baseTemplate } from '../baseTemplate';

export function securityAlert({ name, eventType, ipAddress, location, timestamp, changePasswordUrl }: {
  name: string;
  eventType: 'new_login' | 'password_changed' | 'email_changed' | 'suspicious_activity';
  ipAddress?: string; location?: string; timestamp: string; changePasswordUrl: string;
}): { subject: string; html: string } {
  const eventLabels: Record<string, { label: string; icon: string; message: string }> = {
    new_login:           { label: 'New Login Detected',      icon: '🔐', message: 'A new login to your account was detected.' },
    password_changed:    { label: 'Password Changed',        icon: '🔑', message: 'Your account password was recently changed.' },
    email_changed:       { label: 'Email Address Changed',   icon: '📧', message: 'Your account email address was recently changed.' },
    suspicious_activity: { label: 'Suspicious Activity',     icon: '⚠️', message: 'We detected unusual activity on your account.' },
  };
  const ev = eventLabels[eventType] || eventLabels.suspicious_activity;

  const body = `
    <p>Dear ${name},</p>
    <p>${ev.message}</p>
    <div style="background:#FFF8F0;border:1.5px solid #E8735A40;border-radius:14px;padding:18px 22px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:700;color:#E8735A;">${ev.icon} ${ev.label}</p>
      <p style="margin:4px 0;font-size:13px;color:#7A6A5A;">🕐 Time: <strong>${timestamp}</strong></p>
      ${ipAddress ? `<p style="margin:4px 0;font-size:13px;color:#7A6A5A;">🌐 IP Address: <strong>${ipAddress}</strong></p>` : ''}
      ${location ? `<p style="margin:4px 0;font-size:13px;color:#7A6A5A;">📍 Location: <strong>${location}</strong></p>` : ''}
    </div>
    <p><strong>If this was you</strong>, no action is needed.</p>
    <p><strong>If this was NOT you</strong>, please change your password immediately and contact our support team.</p>
  `;
  return {
    subject: `🔐 Security Alert: ${ev.label} — The Wedding Partners`,
    html: baseTemplate({
      preheader: `Security alert: ${ev.label} detected on your account at ${timestamp}.`,
      headline: `Security Alert ${ev.icon}`,
      body,
      ctaText: 'Change My Password →',
      ctaUrl: changePasswordUrl,
      footerNote: 'If you did not perform this action, contact support@theweddingpartners.com immediately.',
    }),
  };
}
