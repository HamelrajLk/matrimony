# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

═══════════════════════════════════════════════════════════════
PROJECT OVERVIEW
═══════════════════════════════════════════════════════════════

Name:        The Wedding Partners
Description: Sri Lanka's #1 matrimony and wedding services platform.
             Users find life partners AND book wedding services
             (photographers, halls, makeup artists, etc.)
Audience:    Sri Lankan community worldwide (LK, UK, AU, CA, US, UAE)
Status:      🚧 In active development

═══════════════════════════════════════════════════════════════
MONOREPO STRUCTURE
═══════════════════════════════════════════════════════════════

the-wedding-partners/          ← Git root
├── apps/
│   ├── web/                   ← Next.js 14 frontend
│   └── api/                   ← Node.js + Express backend
├── packages/
│   └── shared/                ← Shared types (future)
├── package.json               ← Workspace root
└── CLAUDE.md                  ← This file

═══════════════════════════════════════════════════════════════
DEVELOPMENT COMMANDS
═══════════════════════════════════════════════════════════════

# Root (runs both apps concurrently)
npm run dev                    ← Start both API + Web in dev mode

# Frontend only (apps/web/)
cd apps/web && npm run dev     ← Next.js dev server on :3000
cd apps/web && npm run build
cd apps/web && npm run lint
cd apps/web && npm test        ← Jest tests
cd apps/web && npm test -- --testPathPattern=auth   ← single test file

# Backend only (apps/api/)
cd apps/api && npm run dev     ← ts-node-dev on :5000
cd apps/api && npm run build
cd apps/api && npm test

# Prisma (always run from apps/api/)
cd apps/api && npx prisma db push       ← push schema changes to DB
cd apps/api && npx prisma generate      ← regenerate Prisma client
cd apps/api && npx prisma studio        ← visual DB browser
npx ts-node --project tsconfig.json prisma/seed.ts  ← seed lookup data

IMPORTANT: After ANY change to apps/api/prisma/schema.prisma, you MUST
run BOTH `prisma db push` AND `prisma generate` in sequence.
The generated client lives at apps/api/src/generated/prisma/ — never edit it.

IMPORTANT: The seed command is NOT configured via prisma.config.ts.
Run it directly: cd apps/api && npx ts-node --project tsconfig.json prisma/seed.ts

═══════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════

FRONTEND (apps/web/)
  Framework:     Next.js 14 — App Router, Server Components
  Language:      TypeScript (strict mode)
  Styling:       CSS Modules + global CSS (NO Tailwind)
  Fonts:         Playfair Display (headings), Outfit (body)
  State:         Zustand
  Forms:         react-hook-form + zod validation
  Auth:          JWT stored in Zustand + mirrored to `twp-auth` cookie
  API calls:     fetch (lib/auth.ts) + Axios (lib/api.ts)
  Data fetching: TanStack Query (@tanstack/react-query)
  Images:        next-cloudinary
  Toasts:        react-hot-toast
  Payments:      @stripe/stripe-js + @stripe/react-stripe-js
  Path alias:    @/* → src/*

BACKEND (apps/api/)
  Runtime:       Node.js 20
  Framework:     Express.js
  Language:      TypeScript
  ORM:           Prisma (PostgreSQL) — client at src/generated/prisma/
  Auth:          JWT (jsonwebtoken) + bcrypt
  Validation:    Zod
  Real-time:     Socket.io
  File uploads:  Multer + Cloudinary
  Email:         Resend (all transactional email via services/email/)
  Payments:      Stripe (stripe package, v22+)
  Rate limiting: express-rate-limit

  IMPORTANT — Prisma import pattern:
  Always import from '../lib/prisma' (NOT '../config/database'):
    import { prisma } from '../lib/prisma';
  The prisma singleton uses PrismaPg adapter for Supabase connection pooling.

DATABASE
  Provider:      Supabase (managed PostgreSQL)
  ORM:           Prisma
  Schema file:   apps/api/prisma/schema.prisma

═══════════════════════════════════════════════════════════════
KEY ARCHITECTURAL PATTERNS
═══════════════════════════════════════════════════════════════

AUTH FLOW (JWT, not Supabase Auth)
  - Registration: POST /api/auth/register → returns JWT + emailVerified: false
  - OTP emailed (6-digit, 10min expiry); user must verify before login works
  - Verification: POST /api/auth/verify-email → status: 'ACTIVE'
  - Login: POST /api/auth/login → JWT stored in Zustand authStore
  - JWT mirrored to `twp-auth` cookie so Next.js middleware can read it server-side
  - Protected routes: apps/web/src/middleware.ts checks cookie; API uses auth.middleware.ts
  - req.user shape: { userId: number; role: string } — use req.user.userId (NOT req.user.id)

SERVER vs CLIENT COMPONENT PATTERN
  - Pages that need server-fetched data: split into page.tsx (server) + ComponentForm.tsx (client)
  - Example: signup/page.tsx fetches lookup data server-side → passes to SignupForm.tsx as props
  - This avoids useEffect fetches and hardcoded fallback arrays in client components

LOOKUP DATA (genders, occupations, religions, etc.)
  - Always fetched from GET /api/profiles/lookup — never hardcoded on the frontend
  - Server components fetch at build/request time with next: { revalidate: 3600 }
  - Prisma seed populates all lookup tables: apps/api/prisma/seed.ts

I18N (multilingual support)
  - Three locales supported: en, ta (Tamil), si (Sinhala)
  - Locale persisted in Zustand langStore (store/langStore.ts) with key `twp-lang`
  - LanguageSwitcher component in components/shared/LanguageSwitcher.tsx
  - HtmlLangSync component syncs <html lang> attribute with active locale

PROFILE AUTO-CREATION
  - When a USER role registers, auth.controller.ts automatically creates a Profile record
  - Profile starts with just userId, gender, firstName, lastName
  - User fills in remaining fields via the complete-profile flow

OPPOSITE-GENDER BROWSE ENFORCEMENT
  - Browse page fetches the logged-in user's gender from GET /api/profiles/me
  - `oppositeGender` state is computed and injected into EVERY search query as the `gender` param
  - Gender is NEVER exposed as a user-visible filter control — it's always automatic
  - `buildQuery(filters, page, oppGender)` always passes gender — user cannot override it

REGISTER SCHEMA (backend discriminated union)
  - apps/api/src/utils/validations.ts uses z.discriminatedUnion('role', [...])
  - USER role schema: firstName, lastName, email, password, gender
  - PARTNER role schema: businessName, contactPerson, businessEmail, phone, password, services[]

BROWSE FILTERS → API PARAMS
  - Age: minAge/maxAge → computed from birthdate in DB
  - Height: minHeight/maxHeight (cm)
  - eatingHabits: comma-separated string → Prisma `hasEvery` array operator
  - All other filters: direct enum/ID comparisons

SUBSCRIPTION SYSTEM
  - Plans: FREE, GOLD, DIAMOND, PLATINUM (stored in SubscriptionPlan table)
  - Pricing: SubscriptionPlanPrice (3/6/12 months per paid plan)
  - Features: SubscriptionFeature + PlanFeatureAssignment (included/quantity per plan)
  - Prisma relation name on SubscriptionPlan → PlanFeatureAssignment is `features` (NOT featureAssignments)
  - User subscriptions: UserSubscription (status: ACTIVE | PENDING | CANCELLED | EXPIRED)
  - PENDING = bank transfer awaiting admin verification
  - ACTIVE = paid and live (set immediately for Stripe; manually for bank transfer)

PAYMENT FLOW
  - Stripe: POST /api/payments/stripe/create-checkout-session → redirect to Stripe hosted page
    → webhook POST /api/payments/stripe/webhook activates subscription on checkout.session.completed
    → Stripe webhook route MUST receive raw body — registered before JSON middleware in app.ts
  - Bank Transfer: POST /api/payments/bank-transfer → creates PENDING subscription
    → admin manually verifies and activates
  - Success redirect: /dashboard/upgrade?payment=success
  - Cancel redirect:  /dashboard/upgrade?payment=cancelled

PROFILE VIEW NOTIFICATIONS
  - getProfileById in profile.controller.ts records a ProfileView on every visit
  - First-time view only: sends in-app notification + email to profile owner
  - If profile is matchmaker-managed, matchmaker also gets notified

EMAIL SYSTEM (services/email/)
  - Provider: Resend (resend npm package)
  - FROM address: notifications@theweddingpartners.com
  - Main entry: services/email/index.ts — exports sendEmail() + all template functions
  - Base layout: services/email/baseTemplate.ts — reusable warm-cream HTML wrapper
  - All 22 templates live in services/email/templates/
  - Old email.service.ts is now a shim that proxies to the new system (keeps existing imports working)
  - Never use nodemailer for new email code — always use sendEmail() from services/email/

MATCH ACCEPT/DECLINE
  - Users can accept/decline incoming match requests inline (dashboard home + profile detail page)
  - ProfileListCard accepts receivedMatchId + onRespond props for inline accept/decline
  - Received matches fetched from GET /api/matches/received (NOT /api/matches)

═══════════════════════════════════════════════════════════════
DESIGN SYSTEM
═══════════════════════════════════════════════════════════════

COLORS
  --gold:        #F4A435   ← Primary accent, buttons, highlights
  --coral:       #E8735A   ← Secondary accent, hover states
  --pink:        #E85AA3   ← Partners section accent
  --violet:      #7B8FE8   ← Steps/how-it-works accent
  --teal:        #4ABEAA   ← Verified/success accent
  --bg-cream:    #FFFBF7   ← Main page background
  --bg-warm:     #FFF8F2   ← Section backgrounds
  --text-dark:   #2A1A1A   ← Primary text
  --text-mid:    #7A6A5A   ← Secondary text
  --text-muted:  #9A8A7A   ← Placeholder/caption text
  --bg-dark:     #1C0E08   ← Footer background only

TYPOGRAPHY
  Display/headings: 'Playfair Display', serif — weight 700-800
  Body/UI text:     'Outfit', sans-serif — weight 300-700
  Email templates:  Georgia (headings), Arial (body) — web-safe email fonts
  NEVER use: Inter, Roboto, Arial, or system fonts in UI components

BUTTONS (CSS classes in globals.css)
  .btn-primary       ← Gold→Coral gradient, white text, pill shape
  .btn-white         ← White bg, coral text, pill shape
  .btn-outline-white ← Transparent, white border (for dark backgrounds)
  .btn-outline-gold  ← Transparent, gold border (for light backgrounds)
  Border radius: always 50px (pill/rounded)

COMPONENT CLASSES
  .input-field      ← Form inputs — warm border, gold focus ring
  .nav-link         ← Nav links with gold underline on hover
  .feature-card     ← White card, lift on hover, colored bottom border
  .partner-card     ← White card, lift + border color on hover
  .step-card        ← White card, lift on hover

DESIGN RULES
  ✅ Bright, warm, elegant — NOT dark or cold
  ✅ Soft gradient backgrounds (cream, blush, lavender tints)
  ✅ Glassmorphism for overlays (backdrop-filter: blur)
  ✅ Scroll-triggered fade-in animations on all sections
  ✅ Floating hearts/petals particle effects on hero + CTA sections
  ✅ Rounded everything — cards (20-28px), buttons (50px), icons (16-18px)
  ✅ Gold divider lines between section title and subtitle
  ✅ Mobile responsive (CSS grid, clamp() for font sizes)
  ❌ NO dark backgrounds except footer (#1C0E08)
  ❌ NO purple gradients
  ❌ NO harsh shadows

ANIMATIONS (defined in globals.css — reuse these)
  gradShift    ← Hero background gradient shift (12s loop)
  slideUp      ← Entry animation for hero text
  float        ← Floating card in hero
  heartbeat    ← Logo heart icon
  ripple       ← Logo ring pulse
  spinSlow     ← Decorative rings in hero
  sparkle      ← Sparkle dots
  petalFall    ← Falling petals (PetalRain component)
  marquee      ← Bottom ticker strip
  fadeSlide    ← Testimonial transitions

═══════════════════════════════════════════════════════════════
FRONTEND FILE STRUCTURE
═══════════════════════════════════════════════════════════════

apps/web/src/
├── app/
│   ├── layout.tsx              ← Root layout (Navbar + Footer)
│   ├── page.tsx                ← Homepage
│   ├── (auth)/                 ← Auth pages (no Navbar/Footer, has PetalRain)
│   │   ├── layout.tsx          ← Brand logo (links to /), PetalRain background
│   │   ├── login/page.tsx
│   │   ├── signup/
│   │   │   ├── page.tsx        ← Server component: fetches lookup data from /api/profiles/lookup
│   │   │   └── SignupForm.tsx  ← Client component: 4-step form (role→fields→OTP→done)
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/            ← Protected individual user pages
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       ├── page.tsx                ← Dashboard home (suggestions + pending matches with inline accept/decline)
│   │       ├── browse/page.tsx         ← Profile browsing (opposite-gender auto-filter)
│   │       ├── profile/page.tsx        ← Edit own profile (bloodGroup, grewUpInCountryIds added)
│   │       ├── profile/[id]/page.tsx   ← View another user's profile (accept/decline if they sent request)
│   │       ├── matches/page.tsx        ← Mutual matches
│   │       ├── daily-matches/page.tsx  ← AI-suggested daily matches
│   │       ├── inbox/page.tsx          ← Conversations/chat inbox
│   │       ├── views/page.tsx          ← Who viewed my profile
│   │       └── upgrade/page.tsx        ← Subscription plans + payment modal (Stripe + bank transfer)
│   ├── (broker)/               ← Protected broker pages (not yet built)
│   ├── partners/               ← Partner pages (public listing + dashboard)
│   │   ├── page.tsx            ← Partner directory
│   │   ├── [type]/page.tsx     ← Partner category listing
│   │   └── dashboard/          ← Partner/matchmaker dashboard (clickable stat cards)
│   ├── profiles/[referenceCode]/page.tsx ← Public profile by reference code
│   ├── browse/page.tsx         ← Public profile browsing (unauthenticated)
│   ├── browse/[id]/page.tsx    ← Public profile detail
│   └── about/page.tsx
│
├── components/
│   ├── landing/                ← Homepage section components + Navbar.tsx + Footer.tsx
│   │   └── ui/                 ← AnimIn.tsx, PetalRain.tsx, ParticleCanvas.tsx, CountUp.tsx
│   ├── shared/                 ← Reusable UI: PhotoUploadModal, DateOfBirthPicker,
│   │   │                          SearchDropdown, LanguageSwitcher, DashboardFooter
│   ├── matchmaker/             ← MatchmakerProfileForm.tsx
│   └── auth/
│       ├── AuthGuard.tsx
│       └── UserMenu.tsx
│
├── lib/
│   ├── auth.ts                 ← fetch-based auth API calls (signUpIndividual, loginWithEmail, etc.)
│   ├── api.ts                  ← Axios instance with JWT interceptors
│   ├── socket.ts               ← Socket.io client singleton (getSocket, disconnectSocket)
│   └── validations.ts          ← Zod schemas (client-side)
│
├── store/
│   ├── authStore.ts            ← Zustand: { user, token, setAuth, clearAuth }
│   └── langStore.ts            ← Zustand: { locale, setLocale } — persisted as `twp-lang`
│
└── middleware.ts               ← Checks `twp-auth` cookie; redirects unauthenticated users

═══════════════════════════════════════════════════════════════
BACKEND FILE STRUCTURE
═══════════════════════════════════════════════════════════════

apps/api/src/
├── index.ts                    ← Entry point (http server + socket init)
├── app.ts                      ← Express app (middleware, routes)
│                                  NOTE: Stripe webhook raw body registered BEFORE json middleware
├── config/
│   ├── cloudinary.ts
│   └── socket.ts               ← Socket.io init + JWT auth
├── lib/
│   └── prisma.ts               ← Prisma singleton (PrismaPg adapter) — import from here
├── routes/
│   ├── auth.routes.ts
│   ├── profile.routes.ts
│   ├── match.routes.ts
│   ├── subscription.routes.ts  ← /api/subscriptions/plans, /me, /subscribe
│   ├── payment.routes.ts       ← /api/payments/stripe/* and /api/payments/bank-transfer
│   └── ...other routes
├── controllers/
│   ├── auth.controller.ts      ← register (creates User + Profile), verifyEmail, resendOtp, login, me, logout
│   ├── profile.controller.ts   ← browseProfiles, updateMyProfile (bloodGroup + grewUpInCountryIds),
│   │                              getProfileById (records ProfileView + sends notifications)
│   ├── subscription.controller.ts ← getSubscriptionPlans, getMySubscription, subscribe
│   └── payment.controller.ts   ← createCheckoutSession, stripeWebhook, createBankTransfer
├── middleware/
│   ├── auth.middleware.ts      ← JWT verify → req.user { userId, role }
│   └── validate.middleware.ts  ← Zod body validation
├── services/
│   ├── email.service.ts        ← Backwards-compat shim → proxies to services/email/
│   ├── email/
│   │   ├── index.ts            ← sendEmail() via Resend + re-exports all templates
│   │   ├── baseTemplate.ts     ← Reusable warm-cream HTML email layout
│   │   └── templates/          ← 22 template files (see EMAIL TEMPLATES section)
│   └── match.service.ts        ← AI matching score calculation
└── utils/
    └── validations.ts          ← Zod schemas: registerSchema (discriminatedUnion), etc.

═══════════════════════════════════════════════════════════════
EMAIL TEMPLATES (services/email/templates/)
═══════════════════════════════════════════════════════════════

Usage pattern:
  import { sendEmail, welcome } from '../services/email';
  const { subject, html } = welcome({ name, profileUrl, gender });
  await sendEmail({ to, subject, html });

Account emails:
  welcome({ name, profileUrl, gender })
  verificationOTP({ name, otp, expiresInMinutes })
  profileApproved({ name, profileUrl, referenceId })
  profileIncomplete({ name, missingFields[], profileUrl })
  passwordReset({ name, resetUrl, expiresInHours })

Match activity:
  interestReceived({ recipientName, senderAge, senderReligion, senderCountry, senderGender, profileUrl })
  interestAccepted({ recipientName, acceptorFirstName, acceptorAge, acceptorCountry, chatUrl })
  interestDeclined({ recipientName, browseUrl })
  dailyMatchDigest({ recipientName, matches[], totalNewToday, allMatchesUrl })

Messaging:
  newMessageAlert({ recipientName, senderFirstName, messagePreview, chatUrl })
  unreadMessagesDigest({ recipientName, unreadCount, senders[], inboxUrl })

Engagement:
  inactiveReminder({ recipientName, daysSinceLogin, pendingInterestsCount, profileViewsCount, loginUrl })
  weeklyActivitySummary({ recipientName, stats{}, topMatch, dashboardUrl })
  matchmakerContact({ recipientName, matchmakerName, matchmakerPhone, message, profileUrl })

Subscription:
  subscriptionReceipt({ name, planName, planColor, durationMonths, amountLKR, startDate, expiryDate, paymentRef, dashboardUrl })
  planExpiring({ name, planName, daysLeft, expiryDate, renewUrl })
  planExpired({ name, planName, renewUrl })

Premium features:
  photoRequest({ recipientName, requesterFirstName, requesterAge, requesterCountry, profileUrl })
  contactRequest({ recipientName, requesterFirstName, requesterAge, requesterCountry, message, profileUrl })
  horoscopeMatch({ recipientName, matchAge, matchCountry, compatibilityScore, profileUrl })

Misc:
  securityAlert({ name, eventType, ipAddress, location, timestamp, changePasswordUrl })
  successStoryInvite({ name, submitUrl })
  culturalGreeting({ recipientName, festival, dashboardUrl })
    festivals: sinhala_new_year | deepavali | eid | christmas | vesak | new_year

═══════════════════════════════════════════════════════════════
API ROUTES REFERENCE
═══════════════════════════════════════════════════════════════

Auth
  POST   /api/auth/register         ← { firstName, lastName, email, password, gender, role } or partner fields
  POST   /api/auth/login
  GET    /api/auth/me               🔒
  POST   /api/auth/logout           🔒
  POST   /api/auth/verify-email     ← { email, otp }
  POST   /api/auth/resend-otp       ← { email }
  POST   /api/auth/forgot-password
  POST   /api/auth/reset-password

Profiles
  GET    /api/profiles              ← paginated + filtered (see filter params below)
  GET    /api/profiles/lookup       ← returns all lookup data (no auth)
  GET    /api/profiles/me           🔒 returns own profile
  PUT    /api/profiles/me           🔒 update own profile (incl. bloodGroup, grewUpInCountryIds)
  POST   /api/profiles/me/preferences 🔒
  POST   /api/profiles/me/photos    🔒 upload photos (multipart)
  DELETE /api/profiles/me/photos/:photoId 🔒
  PUT    /api/profiles/me/photos/:photoId/primary 🔒
  GET    /api/profiles/suggestions  🔒
  GET    /api/profiles/views/mine   🔒
  GET    /api/profiles/visitors     🔒
  GET    /api/profiles/:id          ← records ProfileView + triggers notifications

Browse filter query params (GET /api/profiles):
  gender, minAge, maxAge, minHeight, maxHeight, religionId, motherTongueId,
  countryLivingId, nativeCountryId, citizenshipId, educationId, occupationId,
  employmentStatus, maritalStatus, bodyType, physicalStatus,
  smokingHabit, drinkingHabit, eatingHabits (comma-separated → hasEvery),
  hasPhoto, page, limit

Matches
  GET    /api/matches/sent          🔒 matches I sent
  GET    /api/matches/received      🔒 matches sent TO me (use this, not /api/matches)
  POST   /api/matches               🔒 send interest
  PUT    /api/matches/:id           🔒 { status: 'ACCEPTED' | 'DECLINED' }

Subscriptions
  GET    /api/subscriptions/plans   ← ?audience=INDIVIDUAL|MATCHMAKER (no auth)
  GET    /api/subscriptions/me      🔒 current user's active subscription
  POST   /api/subscriptions/subscribe 🔒 { planId, durationMonths }

Payments
  POST   /api/payments/stripe/create-checkout-session 🔒 { planId, durationMonths }
  POST   /api/payments/stripe/webhook    ← raw body, Stripe signature verified
  POST   /api/payments/bank-transfer     🔒 { planId, durationMonths, senderName, senderBank, transferRef }

Other routes — see apps/api/src/routes/
  /api/conversations, /api/messages, /api/searches,
  /api/matchmaker, /api/partners, /api/brokers, /api/bookings, /api/upload,
  /api/notifications

═══════════════════════════════════════════════════════════════
ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════════

apps/web/.env.local
  NEXT_PUBLIC_API_URL=http://localhost:5000
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

apps/api/.env
  PORT=5000
  NODE_ENV=development
  DATABASE_URL=                          ← Supabase connection string
  JWT_SECRET=
  JWT_EXPIRES_IN=7d
  CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  RESEND_API_KEY=                        ← Resend API key for all transactional email
  FROM_EMAIL=notifications@theweddingpartners.com
  CLIENT_URL=http://localhost:3000
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...

═══════════════════════════════════════════════════════════════
CODING CONVENTIONS
═══════════════════════════════════════════════════════════════

COMPONENTS
  - Default to Server Components; add 'use client' only for state/effects/events/browser APIs
  - Pages that fetch data AND have interactivity: split into page.tsx (server) + XxxForm.tsx (client)
  - Form validation errors show inline via react-hook-form — NOT via toast
  - Toast (react-hot-toast) for server errors and success messages only

API RESPONSES
  - Always return { message, data?, error? }
  - HTTP status codes: 200 success, 201 created, 400 bad request, 401 unauth, 403 forbidden, 409 conflict, 500 server error

PRISMA PATTERNS
  - Number query params: always cast with Number(req.query.x) before Prisma where clause
  - String arrays: eatingHabits uses { hasEvery: string[] } not { equals }
  - After schema change: MUST run `prisma db push` then `prisma generate`
  - Always import prisma from '../lib/prisma' — never '../config/database'
  - Cast models not yet in generated types: (prisma as any).modelName

STRIPE PATTERNS
  - Webhook route must use express.raw({ type: 'application/json' }) — registered BEFORE json middleware
  - Stripe v22 types: use `any` for event/session objects from webhook (StripeConstructor namespace differs)
  - Stripe constructor: new Stripe(key) — no apiVersion needed with v22

EMAIL PATTERNS
  - All new email code uses: import { sendEmail, templateFn } from '../services/email'
  - Never use nodemailer for new code
  - sendEmail() never throws — errors are logged silently so requests never fail over email

NAMING
  - Components: PascalCase | Hooks: camelCase use* | Constants: UPPER_SNAKE_CASE
  - CSS classes: kebab-case | API routes: kebab-case | DB: snake_case → Prisma camelCase

═══════════════════════════════════════════════════════════════
WHAT'S BUILT ✅
═══════════════════════════════════════════════════════════════

✅ Monorepo (npm workspaces)
✅ Homepage — Hero, Search, Features, Partners, How It Works, Testimonials, CTA, Footer
✅ Design system — globals.css tokens, animations, utility classes
✅ Auth pages — Login, Signup (4-step: role → fields → OTP → done), Forgot/Reset Password
✅ Auth backend — register (+ auto Profile creation), verifyEmail OTP, resendOtp, login, logout, forgot/reset password
✅ JWT auth middleware + Next.js middleware (twp-auth cookie)
✅ Dashboard — browse (opposite-gender auto-filter), home, matches, daily-matches, inbox, views
✅ Complete-profile flow — /dashboard/profile with all fields including bloodGroup + grewUpInCountryIds
✅ Profile controller — browseProfiles, updateMyProfile, photos, preferences, suggestions, views
✅ Profile view tracking — ProfileView recorded on getProfileById; notifications + email on first view
✅ Match accept/decline — inline from dashboard home suggestions list + profile detail page
✅ Lookup API — GET /api/profiles/lookup
✅ Partner pages — public directory (/partners, /partners/[type]) + partner dashboard (clickable stat cards)
✅ Matchmaker dashboard — create/edit/manage profiles for others
✅ Socket.io config (backend) + Socket.io client singleton (frontend lib/socket.ts)
✅ i18n — en/ta/si locale support via langStore
✅ Prisma schema (all tables including subscription system)
✅ Subscription system — FREE/GOLD/DIAMOND/PLATINUM plans with features, pricing, seeded data
✅ Upgrade page — /dashboard/upgrade with plan cards, feature comparison table, duration toggle
✅ Payment — Stripe Checkout (card) + bank transfer (Sri Lanka) with full payment modal UI
✅ Stripe webhook — activates subscription on checkout.session.completed
✅ Bank transfer — creates PENDING subscription for manual admin verification
✅ Email system — Resend provider, 22 templates, warm branded base layout
✅ Email templates — welcome, OTP, profile approved/incomplete, password reset,
                     interest received/accepted/declined, daily match digest, message alert,
                     unread digest, matchmaker contact, inactive reminder, weekly summary,
                     subscription receipt, plan expiring/expired, photo request, contact request,
                     security alert, horoscope match, success story invite, cultural greetings

═══════════════════════════════════════════════════════════════
TODO ❌
═══════════════════════════════════════════════════════════════

❌ Subscription permissions enforcement (feature gating based on active plan)
❌ Broker dashboard (manage multiple profiles)
❌ Real-time chat UI (Socket.io frontend — backend + client singleton exist)
❌ Booking system
❌ Admin dashboard (manage subscriptions, verify bank transfers, approve profiles)
❌ Scheduled email jobs (daily digest at 8am, weekly summary, inactive reminders)
❌ PayHere integration (Sri Lanka local payment gateway — alternative to bank transfer)
❌ Mobile app (React Native — future)

═══════════════════════════════════════════════════════════════
IMPORTANT NOTES
═══════════════════════════════════════════════════════════════

1. Auth uses JWT + custom backend — NOT Supabase Auth (ignore supabase.ts for auth)
2. Gender filter on browse is ALWAYS automatic (opposite of logged-in user) — never expose it as UI
3. PetalRain component is used in both the landing hero and auth layout background
4. New pages MUST use AnimIn for scroll animations and match the warm design system
5. All DB ops go through Prisma singleton at apps/api/src/lib/prisma.ts (NOT config/database.ts)
6. Platform serves Sri Lankan audience — cultural sensitivity matters in content
7. Subscription Prisma relation: SubscriptionPlan.features (PlanFeatureAssignment[]) — NOT featureAssignments
8. req.user.userId (number) — NOT req.user.id — in all authenticated controllers
9. Stripe webhook must receive raw body — already configured in app.ts before json middleware
10. To send any email: import { sendEmail } from '../services/email' and call sendEmail({ to, subject, html })
11. Bank transfer subscriptions start as PENDING — need admin flow to activate them
