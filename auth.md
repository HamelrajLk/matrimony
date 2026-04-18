You are an expert Next.js 14 + Supabase + TypeScript developer.
I need you to build a complete Authentication system (Signup, Login, 
Logout, Protected Routes) for my project called "The Wedding Partners".

═══════════════════════════════════════════
PROJECT CONTEXT
═══════════════════════════════════════════

Project: The Wedding Partners
Description: Sri Lankan matrimony + wedding services platform
Stack: Next.js 14 (App Router), TypeScript, Supabase Auth, 
       Prisma ORM, Express API backend, Zustand state management

Monorepo structure:
  apps/web/   → Next.js 14 frontend (App Router, src/ directory)
  apps/api/   → Node.js + Express backend

Path alias: @/* → src/*

Design system already set up:
  - Fonts: 'Playfair Display' (headings), 'Outfit' (body)
  - Primary colors: #F4A435 (gold), #E8735A (coral), #E85AA3 (pink)
  - Background: #FFFBF7 (cream)
  - CSS classes available: .btn-primary, .btn-white, .btn-outline-gold, 
    .input-field, .nav-link
  - Animations: heartbeat, float, gradShift, slideUp (defined in globals.css)
  - All pages must match the warm, bright, elegant wedding aesthetic
    of the homepage (NOT dark, NOT generic)


──────────────────────────────────────────
FRONTEND (apps/web/src/)
──────────────────────────────────────────

1. lib/supabase.ts
   - Supabase browser client
   - Supabase server client (for Server Components)
   - Helper: getCurrentUser() server-side

2. lib/auth.ts
   - signUpWithEmail(email, password, userType, name)
   - loginWithEmail(email, password)
   - logout()
   - getSession()
   - resetPassword(email)

3. store/authStore.ts  (Zustand)
   - State: user, session, isLoading, isAuthenticated
   - Actions: setUser, setSession, clearAuth
   - Persist to localStorage

4. hooks/useAuth.ts
   - useAuth() hook — returns user, isLoading, isAuthenticated
   - Listens to Supabase auth state changes
   - Syncs with Zustand store

5. middleware.ts  (Next.js middleware — in src/ root)
   - Protect /dashboard/* routes → redirect to /login if not authed
                                 → redirect to /partners/dashboard if role = PARTNER
   - Protect /partners/dashboard/* → redirect to /login if not authed
                                   → redirect to /dashboard if role = USER
   - Redirect authed users away from /login and /signup
     (send to their correct dashboard based on role)

6. app/(auth)/layout.tsx
   - Centered layout with warm gradient background
   - Wedding Partners logo/branding top center
   - No Navbar, no Footer (clean auth pages)

7. app/(auth)/signup/page.tsx  — FULL SIGNUP PAGE with:
   - Step 1: Choose account type (2 cards)
       Card 1: Individual — "I'm looking for my life partner"  (👤)
       Card 2: Partner   — "I offer wedding services"          (🤝)
       (Each card styled with the brand colors, hover animations,
        tick/check when selected)

   - Step 2: Fill in details form
       ── IF Individual ──────────────────────────────────────────
         · Full Name          (required)
         · Email              (required)
         · Password           (required, strength indicator)
         · Confirm Password   (required)
         · Phone              (optional)
         · Country dropdown   (optional)

       ── IF Partner ─────────────────────────────────────────────
         · Business / Partner Name   (required)  ← businessName
         · Contact Person Name       (required)  ← contactPerson
         · Contact Email             (required)  ← businessEmail
         · Phone                     (required)
         · Password                  (required, strength indicator)
         · Confirm Password          (required)
         · Services Offered          (required, multi-select checkboxes)
             Options (map to PartnerType enum):
               □ Matchmaker      □ Photographer    □ Wedding Hall / Venue
               □ Transport       □ Makeup Artist   □ Florist
               □ Catering        □ DJ & Music       □ Cake Designer
               □ Videographer    □ Other
             At least one service must be selected.

       Password strength indicator
       Show/hide password toggle

   - Step 3: Success screen with animation (confetti or hearts)
       "Welcome to The Wedding Partners!" message
       Button to go to dashboard or complete profile
   - Form validation with react-hook-form + zod
   - "Already have an account? Login" link
   - All 3 steps animated with smooth transitions

8. app/(auth)/login/page.tsx  — FULL LOGIN PAGE with:
   - Email + Password fields
   - Show/hide password toggle
   - "Remember me" checkbox
   - "Forgot Password?" link
   - Login button (shows loading spinner while authenticating)
   - Error messages displayed beautifully (wrong password, 
     user not found, etc.)
   - "Don't have an account? Sign Up" link
   - Warm, elegant design matching homepage aesthetic
   - Subtle animated background (floating hearts/petals)
   - No Google / social login

9. app/(auth)/forgot-password/page.tsx
   - Email input
   - Send reset link button with loading state
   - Success state: "Check your email" screen
   - Back to login link

10. app/(auth)/reset-password/page.tsx
    - New password + confirm password fields
    - Password strength indicator
    - Success state with redirect to login

11. components/auth/AuthGuard.tsx
    - Client component wrapping protected pages
    - Shows loading spinner while checking auth
    - Redirects to /login if not authenticated

12. components/auth/UserMenu.tsx
    - Avatar/initials circle (top right of Navbar)
    - Dropdown: Profile, Dashboard, Settings, Logout
    - Shows user's name and userType badge

──────────────────────────────────────────
BACKEND (apps/api/src/)
──────────────────────────────────────────

13. controllers/auth.controller.ts  with these methods:
    - register(req, res)
      · Validate input with zod (schema differs by role)
      · Check email not already taken
      · Hash password with bcrypt (12 rounds)
      · Create User row (role = USER or PARTNER, status = PENDING)
      · IF role = USER   → no extra row yet (profile created later)
      · IF role = PARTNER →
          - Create Partner row: businessName, businessEmail, contactPerson, phone
          - Create PartnerTypeAssignment rows for each selected service
      · Sign Supabase JWT for the new user
      · Send welcome email via email.service.ts
      · Return: { user, token, role }

    - login(req, res)
      · Validate email + password
      · Find user in DB — reject if status = INACTIVE
      · Only allow role = USER or PARTNER (ADMIN has separate project)
      · Compare bcrypt hash
      · Generate JWT (7 days) — include role in payload
      · Return: { user, token, role }
        (Frontend uses `role` to redirect:
          USER    → /dashboard
          PARTNER → /partners/dashboard)

    - me(req, res)
      · Authenticated route (uses auth middleware)
      · Return current user from DB (no passwordHash)

    - logout(req, res)
      · Invalidate token (blacklist in Redis or just return 200)

    - forgotPassword(req, res)
      · Find user by email
      · Generate reset token (crypto.randomBytes)
      · Store hashed token + expiry in DB
      · Send email via Resend/SendGrid with reset link

    - resetPassword(req, res)
      · Validate token
      · Hash new password
      · Update user in DB
      · Return success

14. routes/auth.routes.ts  (update existing file)
    POST /api/auth/register
    POST /api/auth/login
    GET  /api/auth/me          (protected)
    POST /api/auth/logout      (protected)
    POST /api/auth/forgot-password
    POST /api/auth/reset-password

15. services/email.service.ts
    - sendWelcomeEmail(to, name, userType)
    - sendPasswordResetEmail(to, name, resetLink)
    - sendVerificationEmail(to, name, verifyLink)
    Using Resend API (npm package: resend)

16. types/auth.types.ts
    - IndividualRegisterDTO  { name, email, password, phone?, country? }
    - PartnerRegisterDTO     { businessName, contactPerson, businessEmail,
                               phone, password, services: PartnerType[] }
    - LoginDTO               { email, password }
    - ResetPasswordDTO       { token, password }
    - AuthResponse           { user, token, role: 'USER' | 'PARTNER' }
    - JWTPayload             { userId, role, iat, exp }

═══════════════════════════════════════════
VALIDATION SCHEMAS (Zod)
═══════════════════════════════════════════

Frontend (apps/web/src/lib/validations.ts):
  - individualSignupSchema:
      name, email, password (min 8, 1 uppercase, 1 number, 1 special char),
      confirmPassword, phone (optional), country (optional)

  - partnerSignupSchema:
      businessName       (required)
      contactPerson      (required)
      businessEmail      (required, valid email)
      phone              (required)
      password           (min 8, 1 uppercase, 1 number, 1 special char)
      confirmPassword    (required)
      services           (PartnerType[], min 1 selection required)

  - loginSchema: email, password
  - forgotPasswordSchema: email
  - resetPasswordSchema: password, confirmPassword

Backend (apps/api/src/utils/validations.ts):
  - Same schemas mirrored for server-side validation

═══════════════════════════════════════════
ENV VARIABLES NEEDED
═══════════════════════════════════════════

Tell me exactly which env variables to add to:
  - apps/web/.env.local
  - apps/api/.env

═══════════════════════════════════════════
DESIGN REQUIREMENTS (VERY IMPORTANT)
═══════════════════════════════════════════

The auth pages must:
✅ Use 'Playfair Display' for headings, 'Outfit' for body text
✅ Use the warm color palette: #F4A435, #E8735A, #FFFBF7, #E85AA3
✅ Have smooth animations (slideUp, float, heartbeat from globals.css)
✅ Have a floating hearts / petal particle effect in the background
   (reuse ParticleCanvas and PetalRain from 
    src/components/shared/animations.tsx)
✅ Show The Wedding Partners logo (♥ heart icon + brand name)
✅ Have glassmorphism cards (backdrop-filter: blur)
✅ Rounded buttons (border-radius: 50px) matching .btn-primary style
✅ Mobile responsive
✅ Match the homepage vibe — bright, warm, elegant, Sri Lankan

The signup page type-selection step should look like 3 beautiful 
cards side by side, each with:
  - A large emoji (👤 🤝 🌟)
  - Title and description
  - Animated border/glow on selection
  - Tick mark animation when selected

═══════════════════════════════════════════
ADDITIONAL REQUIREMENTS
═══════════════════════════════════════════

- Use 'use client' directive only where needed (forms, hooks)
- Server Components where possible for performance
- All forms must show inline field-level error messages
- Loading states on all async buttons (spinner + disabled)
- Toast notifications for success/error (react-hot-toast)
- After signup → redirect based on role:
    USER    → /dashboard/complete-profile
    PARTNER → /partners/dashboard (profile considered complete at signup)
- After login → redirect based on role (read from JWT):
    USER    → /dashboard
    PARTNER → /partners/dashboard
- No Google / social OAuth — email + password only for all users
- JWT stored in httpOnly cookie (not localStorage) for security
- Refresh token logic handled by Supabase automatically

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

For each file, output:
1. The full file path
2. The complete file contents (TypeScript, no shortcuts)
3. Any npm install commands needed
4. Any Supabase dashboard configuration steps

Generate all 16 files completely. 
Start with the backend files first, then frontend.