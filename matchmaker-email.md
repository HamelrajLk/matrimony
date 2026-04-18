Read CLAUDE.md before starting.

Build the complete email notification system for 
individual (bride/groom) members of The Wedding Partners.

Use Resend (npm package: resend) as the email provider.
FROM address: notifications@theweddingpartners.com

═══════════════════════════════════════════════════
PART 1 — EMAIL SERVICE ARCHITECTURE
apps/api/src/services/email/
═══════════════════════════════════════════════════

Create this folder structure:

services/email/
  index.ts               ← main email service (Resend client)
  templates/
    welcome.ts
    verification.ts
    profileApproved.ts
    profileIncomplete.ts
    passwordReset.ts
    interestReceived.ts
    interestAccepted.ts
    interestDeclined.ts
    dailyMatchDigest.ts
    newMessageAlert.ts
    unreadMessagesDigest.ts
    matchmakerContact.ts
    inactiveReminder.ts
    weeklyActivitySummary.ts
    subscriptionReceipt.ts
    bankTransferPending.ts
    planExpiring.ts
    planExpired.ts
    photoRequest.ts
    contactRequest.ts
    securityAlert.ts
    horoscopeMatch.ts
    successStoryInvite.ts
    culturalGreeting.ts

═══════════════════════════════════════════════════
PART 2 — BASE EMAIL TEMPLATE
services/email/baseTemplate.ts
═══════════════════════════════════════════════════

Create a reusable HTML base layout function:

function baseTemplate({
  preheader: string,      // preview text in inbox
  headline: string,
  body: string,           // HTML content block
  ctaText?: string,
  ctaUrl?: string,
  footerNote?: string,
}): string

Design rules:
  Background: #FFFBF7 (warm cream — matches website)
  Max width: 600px centered
  Header: logo heart ♥ + "The Wedding Partners" in 
          Playfair Display (web-safe: Georgia fallback)
  Accent color: #F4A435 (gold)
  CTA button: #F4A435 bg, white text, 50px border-radius
  Font: Arial (email-safe) with Georgia for headings
  Footer: unsubscribe link, contact, address
  Mobile responsive via media queries in <style>

═══════════════════════════════════════════════════
PART 3 — ALL EMAIL TEMPLATES
One function per template returning: { subject, html }
═══════════════════════════════════════════════════

── ACCOUNT EMAILS ──

welcome({ name, profileUrl, gender })
  Subject: "Welcome to The Wedding Partners, [Name]! 💍"
  Content:
    Warm greeting using their name
    "You've joined thousands of Sri Lankans 
     worldwide searching for their perfect match."
    Profile completion checklist (3 items):
      ☐ Add your photo
      ☐ Complete your horoscope details
      ☐ Set your partner preferences
    CTA: "Complete Your Profile →"

verificationOTP({ name, otp, expiresInMinutes: 15 })
  Subject: "Your verification code: [OTP]"
  Content: Large OTP display (48px font), expiry note
  Security note: "Never share this code with anyone"

profileApproved({ name, profileUrl, referenceId })
  Subject: "✅ Your profile is now live!"
  Content: 
    Congratulations message
    Their reference ID prominently displayed
    Tips: "Profiles with photos get 10× more responses"
    CTA: "View Your Profile →"

profileIncomplete({ name, missingFields: string[], profileUrl })
  Subject: "Your profile is almost ready, [Name]!"
  Content:
    Friendly nudge (not pushy)
    List of missing fields as checkboxes
    Stat: "Complete profiles get 3× more matches"
    CTA: "Complete Profile →"

passwordReset({ name, resetUrl, expiresInHours: 1 })
  Subject: "Reset your password — The Wedding Partners"
  Content: Reset link button, expiry warning
  Security: "If you didn't request this, ignore this email"

── MATCH ACTIVITY EMAILS ──

interestReceived({ 
  recipientName,
  senderAge, senderReligion, senderCountry,
  senderGender,
  profileUrl
})
  Subject: "Someone is interested in your profile! 💕"
  Content:
    "A [age]-year-old [religion] [gender] from [country]
     has expressed interest in your profile."
    Blurred/avatar placeholder (NO real photo — privacy)
    CTA: "View Profile & Respond →"
    Note: "You have 7 days to respond"

interestAccepted({ 
  recipientName,
  acceptorFirstName, acceptorAge, acceptorCountry,
  chatUrl
})
  Subject: "🎉 [Name] accepted your interest!"
  Content:
    Celebration message with heart animation (CSS)
    Their first name + age + country
    "You can now message each other"
    CTA: "Start Chatting →"

interestDeclined({ recipientName })
  Subject: "Keep exploring — your match is out there"
  Content:
    Very gentle, no mention of who declined
    "Sometimes it's not the right fit — 
     and that's perfectly okay."
    CTA: "Browse More Profiles →"
    Show 2-3 new suggested profiles (static cards)

dailyMatchDigest({
  recipientName,
  matches: Array<{
    age, religion, country, 
    profileUrl, isPhotoVisible, photoUrl
  }>,
  totalNewToday: number
})
  Subject: "✨ [X] new profiles match you today"
  Content:
    Grid of 3 profile cards (2-column on mobile)
    Each card: age | religion | country | View button
    Photos shown only if profile has showPhoto=true
    CTA: "View All [X] Matches →"
  Send: Daily at 8:00 AM user's timezone
        Only if there are new matches
        Max 1 per day

newMessageAlert({ 
  recipientName, 
  senderFirstName,
  messagePreview,   // first 60 chars only
  chatUrl
})
  Subject: "New message from [FirstName]"
  Content: 
    Message preview in quote block
    CTA: "Reply Now →"
  Delay: Send only if message not read within 1 hour
  Batch: Max 1 per sender per day (not per message)

unreadMessagesDigest({
  recipientName,
  unreadCount,
  senders: string[],  // first names only, max 3
  inboxUrl
})
  Subject: "You have [X] unread messages waiting"
  Content: "Messages from: Priya, Kumari and 2 others"
  Send: Daily at 6 PM if unread messages exist

inactiveReminder({
  recipientName,
  daysSinceLogin,
  pendingInterestsCount,
  profileViewsCount,
  loginUrl
})
  Subject: "You've been missed, [Name]! 💛"  (7-day)
         OR "Come back — people want to connect" (30-day)
  Content:
    "While you were away:"
    • [X] people viewed your profile
    • [X] people expressed interest  
    • [X] new matches were added
    CTA: "Log In Now →"

weeklyActivitySummary({
  recipientName,
  stats: {
    profileViews, interestsSent, interestsReceived,
    messagesReceived, newMatches
  },
  topMatch: { age, religion, country, profileUrl } | null,
  dashboardUrl
})
  Subject: "Your wee
── SUBSCRIPTION EMAILS ──

subscriptionReceipt({
  name, planName, planColor, durationMonths,
  amount, currency,
  startDate, expiryDate, paymentRef?,
  dashboardUrl
})
  Subject: "✅ Payment confirmed — [Plan] plan activated"
  Content:
    Plan icon + name prominently displayed
    Receipt table: Plan, Duration, Amount Paid, Start Date, Expiry Date, Reference
    "Your premium benefits are now unlocked!" callout box
  Triggered:
    - Immediately after Stripe payment verified (verifyStripeSession or stripeWebhook)
    - For both individual users and matchmakers (PARTNER role)

bankTransferPending({
  name, planName, planColor, durationMonths,
  amount, currency, transferRef,
  dashboardUrl
})
  Subject: "⏳ Bank transfer received — [Plan] plan pending activation"
  Content:
    Transfer summary table: Plan, Duration, Amount, Reference
    "Awaiting Verification" status box with 24-hour promise
    Support contact with transfer reference
  Triggered:
    - Immediately when bank transfer details are submitted (createBankTransfer)
    - Subscription status is PENDING until admin verifies manually
  Note: subscriptionReceipt is sent separately once admin activates the plan

planExpiring({ name, planName, daysLeft, expiryDate, renewUrl })
  Subject: "⚠️ Your [Plan] plan expires in [X] days"
  Content: Days left warning, benefits reminder, renew CTA
  Triggered: Scheduled job — 14 days and 3 days before expiry

planExpired({ name, planName, renewUrl })
  Subject: "Your [Plan] membership has expired"
  Content: Gentle nudge to renew, what they're missing
  Triggered: Scheduled job — day of expiry
