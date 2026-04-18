PROJECT MODULE: Matchmaker (Partner)

DESCRIPTION:
A Matchmaker is a professional partner who helps users find suitable marriage matches. Matchmakers can create and manage multiple user profiles, suggest matches, and communicate with users through the platform.

---

🎯 CORE OBJECTIVE:
Enable matchmakers to act as intermediaries who:
- Create profiles on behalf of clients
- Manage multiple profiles
- Suggest compatible matches
- Communicate with users
- Earn trust and visibility on the platform

---

👤 USER ROLE:
Role: PARTNER
Type: MATCHMAKER

---

🧩 FEATURES & FUNCTIONALITIES

1. MATCHMAKER REGISTRATION
- Register as a partner (matchmaker)
- Provide:
  - Full name
  - Business name (optional)
  - Experience (years)
  - Service location (country/city)
  - Contact details
  - Profile photo
  - Description/About service
- Verification process (admin approval)
- Status: Pending / Approved / Rejected

---

2. MATCHMAKER PROFILE
- Public profile page
- Shows:
  - Name / Business name
  - Experience
  - Ratings & reviews (future)
  - Active profiles managed
  - Success stories (future)
- “Contact Matchmaker” button

---

3. CLIENT PROFILE MANAGEMENT
Matchmakers can create and manage multiple profiles.

Capabilities:
- Create new profile on behalf of client
- Edit/update profile details
- Upload photos
- Set preferences
- Activate/Deactivate profile

Important:
- Profiles linked to matchmakerId
---

4. MATCH SUGGESTION SYSTEM
- Matchmaker can:
  - Search profiles
  - Filter by:
    - All user - profile related params 

---

5. MATCH LIST MANAGEMENT
- Create request for each client
- Manage recived request
    - Accept/Reject

---
<!-- NO NEED COMMUNTICANTION NOW -->
<!-- 6. COMMUNICATION SYSTEM
- Chat with:
  - Clients
  - Other users (if allowed)
- Inbox:
  - List of conversations
  - Message history
- Real-time messaging (Socket.IO) -->

---

7. DASHBOARD
Matchmaker dashboard shows:
- Total profiles managed
- Active matches
- Messages if need
- Profile views (future)
- Notifications - on top bar before user name

---

8. SUBSCRIPTION / PLAN (FUTURE)
- Free tier:
  - Limited profiles
- Paid tier:
  - Unlimited profiles
  - Featured listing

---

9. ADMIN CONTROLS
Admin can:
- Approve/reject matchmaker
- Suspend account
- Monitor activity
- Verify profiles

---

10. NOTIFICATIONS
- New message
- New match suggestion
- Profile updates
- Admin actions

---

🔐 PERMISSIONS & RULES

- Matchmaker can only manage their own profiles
- Cannot access other matchmaker data
- Must be approved before using features
- Messaging allowed only after certain conditions (optional)

---

🧱 DATABASE REQUIREMENTS

---

💡 SPECIAL NOTES

- Matchmaker is a type of Partner (not separate system)
- System must support scalability (many profiles per matchmaker)
- Privacy is critical (profile visibility control)

---

END OF SPEC