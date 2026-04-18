import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'notifications@theweddingpartners.com';

/**
 * Send an email via Resend. Never throws — logs errors silently so a failed
 * email never blocks a request.
 */
export async function sendEmail({
  to, subject, html,
}: {
  to: string; subject: string; html: string;
}): Promise<void> {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[email] Failed to send to', to, ':', err);
  }
}

// Re-export all templates for convenience
export * from './templates/welcome';
export * from './templates/verification';
export * from './templates/profileApproved';
export * from './templates/profileIncomplete';
export * from './templates/passwordReset';
export * from './templates/interestReceived';
export * from './templates/interestAccepted';
export * from './templates/interestDeclined';
export * from './templates/dailyMatchDigest';
export * from './templates/newMessageAlert';
export * from './templates/unreadMessagesDigest';
export * from './templates/matchmakerContact';
export * from './templates/inactiveReminder';
export * from './templates/weeklyActivitySummary';
export * from './templates/subscriptionReceipt';
export * from './templates/bankTransferPending';
export * from './templates/planExpiring';
export * from './templates/planExpired';
export * from './templates/photoRequest';
export * from './templates/contactRequest';
export * from './templates/securityAlert';
export * from './templates/horoscopeMatch';
export * from './templates/successStoryInvite';
export * from './templates/culturalGreeting';
