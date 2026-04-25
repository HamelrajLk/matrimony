# The Wedding Partners — Tester Instruction Guide

**App URL:** https://matrimony-web-kappa.vercel.app  
**API URL:** https://matrimony-api-kappa.vercel.app  
**Platform:** Sri Lanka's matrimony and wedding services platform  

---

## Before You Start

- Use two separate browsers (e.g. Chrome + Firefox) or two incognito windows to test interactions between two users.
- Use real-looking test data (Sri Lankan names, valid email addresses you control).
- Record every bug you find: what you did, what you expected, what actually happened, and a screenshot if possible.
- Do NOT use real payment card details. Use the Stripe test card provided below.

---

## 1. Registration & Email Verification

### 1.1 Register as an Individual User
1. Go to the app homepage → click **Sign Up**
2. Select role: **Individual (Looking for a partner)**
3. Fill in: First name, Last name, Email, Password, Gender
4. Submit and check your email for the 6-digit OTP
5. Enter the OTP on the verification screen

**Expected:** Account created, OTP email received, redirected after verification.

### 1.2 Register as a Wedding Partner (Business)
1. Go to Sign Up → select role: **Wedding Partner**
2. Fill in: Business name, Contact person, Business email, Phone, Password, Services
3. Submit

**Expected:** Partner account created successfully.

### 1.3 Edge Cases to Test
| Test | Expected Result |
|------|----------------|
| Register with an email already in use | Error: "An account with this email already exists" |
| Enter wrong OTP | Error: "Incorrect OTP" |
| Let OTP expire (wait 10+ minutes) then enter it | Error: "OTP has expired" |
| Leave required fields blank | Inline validation errors shown |
| Password too short or weak | Validation error shown |

---

## 2. Login & Logout

### 2.1 Normal Login
1. Go to **Login** page
2. Enter email and password of a verified account
3. Click Login

**Expected:** Redirected to dashboard.

### 2.2 Edge Cases to Test
| Test | Expected Result |
|------|----------------|
| Wrong password | "Invalid email or password" |
| Unverified account (skip OTP step) | Should be prompted to verify |
| Empty fields | Validation errors shown |
| Click **Forgot Password** → enter email → check email → reset password | Password reset email received, can log in with new password |

---

## 3. Browse Profiles (Public + Logged In)

### 3.1 Public Browse (Not logged in)
1. Go to `/browse` without logging in
2. Scroll through profiles

**Expected:** Profiles visible, no private details shown.

### 3.2 Logged-In Browse (Opposite Gender Filter)
1. Log in as a **Male** user
2. Go to Dashboard → Browse

**Expected:** Only **Female** profiles appear. Gender filter is NOT shown as a UI option — it is automatic.

3. Log in as a **Female** user and repeat

**Expected:** Only **Male** profiles appear.

### 3.3 Filters
Test each filter one at a time:
- Age range (min/max)
- Height range
- Religion
- Country living in
- Marital status
- Has photo (toggle)

**Expected:** Results narrow correctly with each filter applied.

---

## 4. Profile Management

### 4.1 Complete Your Profile
1. Log in → go to **Dashboard → My Profile**
2. Fill in all fields: date of birth, religion, occupation, education, country, height, eating habits, etc.
3. Upload a profile photo
4. Save

**Expected:** Profile saves successfully, photo uploads and appears.

### 4.2 Edit Profile
1. Change one or more fields → Save
2. Refresh the page

**Expected:** Updated values persist after refresh.

### 4.3 Profile Photo
| Test | Expected Result |
|------|----------------|
| Upload a photo | Photo appears in profile |
| Set a photo as primary | That photo shows as main |
| Delete a photo | Photo removed |

---

## 5. Sending & Responding to Match Interests

Use **two accounts** (e.g. one Male, one Female) in two browser windows.

### 5.1 Send Interest
1. Log in as User A → Browse → click on User B's profile
2. Click **Send Interest**

**Expected:** Interest sent. User B receives a notification.

### 5.2 Accept / Decline Interest
1. Log in as User B → go to **Dashboard**
2. See the pending interest from User A
3. Click **Accept** or **Decline**

**Expected:**
- Accept → both users can see each other in Matches
- Decline → request removed

### 5.3 Edge Cases
| Test | Expected Result |
|------|----------------|
| Send interest to the same person twice | Should not create duplicate |
| View received interests under Dashboard → Inbox/Matches | All pending interests listed |

---

## 6. Dashboard Sections

Log in and test each section:

| Section | What to Check |
|---------|--------------|
| **Home** | Shows suggested profiles + pending received interests |
| **Browse** | Filters work, opposite-gender profiles shown |
| **My Matches** | Shows mutual accepted matches |
| **Daily Matches** | AI-suggested profiles appear |
| **Who Viewed Me** | Shows users who visited your profile |
| **Inbox** | Conversations listed (if any) |
| **Upgrade** | Subscription plans shown with pricing |

---

## 7. Subscription & Payments

### 7.1 View Plans
1. Go to **Dashboard → Upgrade**

**Expected:** FREE, GOLD, DIAMOND, PLATINUM plans shown with features and pricing.

### 7.2 Stripe Payment (Test Card)
1. Select any paid plan → choose duration → click **Pay with Card**
2. Use test card details:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g. `12/26`)
   - **CVC:** `123`
   - **Name/ZIP:** Any value
3. Complete payment

**Expected:** Redirected back to app with success message. Subscription activated.

### 7.3 Bank Transfer
1. Select a plan → choose **Bank Transfer**
2. Fill in sender name, bank, transfer reference
3. Submit

**Expected:** Submission accepted. Status shows as **Pending** (awaiting admin verification).

### 7.4 Stripe Card Decline Test
Use card `4000 0000 0000 0002` (declined card)

**Expected:** Payment fails with an error message — user stays on upgrade page.

---

## 8. Partner Directory

1. Go to `/partners` (no login needed)
2. Browse partner categories (photographers, halls, makeup artists, etc.)
3. Click on a partner type (e.g. `/partners/photographers`)

**Expected:** Partners listed correctly per category.

---

## 9. Forgot & Reset Password

1. Go to Login → **Forgot Password**
2. Enter your email → Submit
3. Check email for reset link → Click it
4. Enter new password → Submit
5. Log in with the new password

**Expected:** Full flow works end-to-end.

---

## 10. Language Switcher

1. On any page, find the language switcher (EN / Tamil / Sinhala)
2. Switch to Tamil
3. Switch to Sinhala
4. Switch back to English

**Expected:** UI language changes. Selection persists after page refresh.

---

## 11. Responsive / Mobile View

In Chrome: press `F12` → click the phone icon (Toggle Device Toolbar) → select **iPhone 12** or **Samsung Galaxy S20**

Check these pages on mobile:
- Homepage
- Login / Signup
- Browse profiles
- Dashboard home
- Upgrade page

**Expected:** All pages readable and usable on mobile screen. No horizontal scrolling. Buttons tappable.

---

## 12. Security Checks (Basic)

| Test | Expected Result |
|------|----------------|
| Go to `/dashboard` without logging in | Redirected to Login page |
| Go to `/dashboard/upgrade` without logging in | Redirected to Login page |
| Try accessing another user's profile edit page | Should only be able to edit your own profile |

---

## How to Report a Bug

For each bug found, note down:

1. **Page/URL** where it happened
2. **Steps to reproduce** (numbered list of exact actions)
3. **Expected result** (what should have happened)
4. **Actual result** (what actually happened)
5. **Screenshot or screen recording** if possible
6. **Browser and device** used

---

## Test Accounts to Create

Create these accounts before starting (use emails you have access to):

| Account | Gender | Purpose |
|---------|--------|---------|
| testmale@example.com | Male | Send interests, test male browse view |
| testfemale@example.com | Female | Receive interests, test female browse view |
| testpartner@example.com | — (Partner) | Test partner dashboard |

---

*Last updated: April 2026*
