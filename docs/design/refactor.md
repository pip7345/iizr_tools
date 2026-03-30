# Database Refactor: Consolidated Schema

## 1. Overview

This document analyzes a proposed database refactor that consolidates 6 tables into 2:

| Current Tables | Proposed Tables |
|---|---|
| User, ReferralCode, Invitation | **User** |
| CreditTransaction, CreditNomination, InvitationCreditGrant | **CreditTransaction** |

ImpersonationSession remains unchanged.

---

## 2. Current Schema Summary

### Current Tables & Their Purposes

| Table | Records | Purpose |
|---|---|---|
| **User** | Real authenticated users | Profile, role, sponsor hierarchy |
| **ReferralCode** | Reusable signup codes | Multiple per user, each with expiration |
| **Invitation** | Proto-users not yet signed up | Name/email pre-registration, referral link, lifecycle tracking |
| **CreditTransaction** | Finalized credit ledger entries | Immutable audit trail of balance changes |
| **CreditNomination** | Pending credit requests | Approval workflow for credit awards |
| **InvitationCreditGrant** | Credits promised to invitations | Pre-signup credit promises with their own approval + conversion lifecycle |
| **ImpersonationSession** | Admin audit trail | Tracks admin impersonation sessions |

### Current Relationships

```
User ──< ReferralCode ──< Invitation ──< InvitationCreditGrant
  │                                           │
  │ (sponsor/recruits)                        ├── CreditTransaction (on conversion)
  │                                           │
  ├──< CreditTransaction (finalized ledger)   │
  │                                           │
  ├──< CreditNomination ─── CreditTransaction (on approval)
  │
  └──< ImpersonationSession
```

---

## 3. Proposed Schema

### User Table (Consolidated)

```
User {
  id                    String    @id
  name                  String
  email                 String?   @unique
  sponsorId             String?
  preferredDisplayName  String?
  role                  UserRole
  status                UserStatus
  bio                   String?
  location              String?
  joinedAt              DateTime
  referralCode          String    @unique
  claimUserCode         String?   @unique
  createdAt             DateTime
  updatedAt             DateTime
  clerkId               String?   @unique
}
```

### CreditTransaction Table (Consolidated)

```
CreditTransaction {
  id              String              @id
  userId          String
  nominatorId     String?
  amount          Int
  description     String
  category        CreditCategory
  status          CreditStatus
  rejectionReason String?
  approverId      String?
  createdAt       DateTime
  updatedAt       DateTime
}
```

### ImpersonationSession (Unchanged)

```
ImpersonationSession {
  id                 String    @id
  adminId            String
  impersonatedUserId String
  status             ImpersonationSessionStatus
  ipAddress          String?
  userAgent          String?
  startedAt          DateTime
  endedAt            DateTime?
}
```

---

## 4. Problems Identified

### 4.1 Credit Balance Calculation Becomes Fragile

**Severity: HIGH**

Currently, balance is a clean query:
```sql
SELECT SUM(amount) FROM CreditTransaction WHERE userId = ?
```

Every record in `CreditTransaction` is finalized — it represents real balance changes.

With the combined table, PENDING nominations and REJECTED records also live in the same table. Balance becomes:
```sql
SELECT SUM(amount) FROM CreditTransaction
WHERE userId = ? AND status IN ('APPROVED', 'COMPLETED')
```

**Risk:** Every balance query across the entire codebase (at least 8 locations: dashboard, credits page, profile pages, leaderboard, admin user list, recruit tree API, admin credits, seed script) must correctly apply the status filter. A single missed filter means displaying wrong balances or allowing overspending.


The raw SQL leaderboard query in `getLeaderboardPage()` is especially vulnerable since it doesn't go through the ORM.

Phil Says: This is not fragile. You said in another prompt that 'COMPLETED' is no longer necessary. Just filter on 'COMPLETED' to get the true balance. 

---

### 4.2 Single Referral Code Per User Removes Flexibility

**Severity: MEDIUM**

Currently, users can have **multiple** referral codes, each with its own expiration date. The codebase supports:
- `createReferralCode()` — generates new codes on demand
- `getReferralCodesForUser()` — lists all codes
- `deleteReferralCode()` — removes individual codes without affecting others
- Invitation-specific referral codes — each invitation auto-generates its own code

With one `referralCode` per user:
- Users cannot create multiple trackable referral links
- No expiration mechanism (column is missing)
- No way to rotate/regenerate a code without invalidating existing links
- Cannot track which specific code brought in which recruit
- The `/referrals` page managing multiple codes must be completely redesigned or removed

Phil Says: We want a single code. Change requirements to not allow multiple codes per user. No expiration needed. The /referrals page can be removed entirely.

---

### 4.3 Invitation-as-User Creates Status Complexity

**Severity: HIGH**

Current `UserStatus` has 3 values: `ACTIVE`, `INACTIVE`, `PENDING_SIGNUP`.

With invitations merged into User, the status enum must expand to represent:

| State | Meaning | Has ClerkId? | Has SponsorId? |
|---|---|---|---|
| `INVITED` | Invitation created, not yet signed up | No | Yes |
| `PENDING_SIGNUP` | Admin pre-registered from invitation | No | Yes |
| `ACTIVE` | Fully registered user | Yes | Maybe |
| `INACTIVE` | Deactivated user | Yes | Maybe |
| `CANCELED` | Invitation was withdrawn | No | Yes |

**Problems:**
- Every query that lists "real users" must now filter out INVITED and CANCELED records. There are 15+ places that query users: admin user list, eligible sponsors, recruit tree, leaderboard, dashboard stats, profile lookups, etc.
- `getUserStats()` counts total users, active users, admin users — all need status filters
- `getEligibleSponsors()` must exclude non-real users
- `getLeaderboardPage()` raw SQL must be updated
- A "canceled invitation" user record cannot be truly deleted if CreditTransactions reference it

Phil Says: Reduce the state to "PENDING_SIGNUP", "ACTIVE" and "INACTIVE" only. Most places will need to filter by "ACTIVE" only. The admin can set a user be INACTIVE. Those users shouldn't appear anywhere yet. If a user deletes an invitation, set the user to INACTIVE. What else am I missing?

---

### 4.4 Email Uniqueness Conflict for Invitations

**Severity: HIGH**

Current schema: `User.email` is unique. `Invitation.email` has no uniqueness constraint.

Multiple sponsors can currently invite the same email address. In the combined model:
- If email remains unique on User, only one sponsor can create an invitation for a given email
- If email uniqueness is removed, multiple real users could share an email (security issue)
- If a conditional unique index is used (unique only when status = ACTIVE), Prisma doesn't natively support conditional unique indexes

**Additionally:** What happens when someone signs up with an email that matches multiple INVITED user records from different sponsors? The system must decide which invitation to claim.

Phil Says: If an email has already been invited, don't allow allow another user to invite. This unique constraint will be an advantage as it solves a lot of problems because if the e-mail is already in use, the system can prevent duplicate invitations. Propose some solutions to problems we may encounter, such as when a user registers an account with an e-mail that is already used. I would like to see the system check if that account has been claimed, then claim that account. If Clerk authenticates a user's e-mail, that means the user is legitmaate and probalby needs to claim that e-mail.

**Decision: Strict global email uniqueness — one email, one User record across all statuses.**

This is the simplest model and aligns with Clerk's own guarantee that each verified email belongs to one authentic user. Remaining concerns:

**A. Canceled/inactive invitations permanently block re-invitation**
If an invitation is canceled (status → INACTIVE per 4.3), the `email` field on that record still occupies the unique index slot. No sponsor can re-invite that address.
- **Solution:** When canceling an invitation, null out the `email` field on the INACTIVE record. The record itself remains for audit (createdAt, updatedAt, sponsorId, name all preserved), but the email slot is freed. This means email is no longer queryable on canceled records, which is acceptable since the invitation is functionally dead.

**B. Auto-claim when Clerk email matches an existing unclaimed record**
When `syncUserFromClerk()` fires after authentication, before creating any new record it should query for an existing User where `email = clerkEmail AND clerkId IS NULL`. The outcome depends on that record's status:
- **PENDING_SIGNUP (no clerkId):** Auto-claim — link clerkId, set status → ACTIVE, null `claimUserCode`, convert all PENDING INVITATION_CREDIT records → APPROVED. No new User record is created.
- **ACTIVE (has clerkId):** Normal returning-user update path.
- **INACTIVE (no clerkId):** This is a canceled invitation whose email was not nulled out — shouldn't happen if Solution A is followed. Treat as no-match and proceed to create a new user.
- **INACTIVE (has clerkId):** The account was deactivated by an admin. Do NOT auto-claim or reactivate silently. Return a clear "account deactivated" error and require admin action.

This makes the `claimUserCode` in the invitation URL optional: users who sign up with the same email they were invited with are claimed automatically without needing to click the invitation link.

**C. Claim code as fallback for mismatched emails**
If the invitee signs up via Clerk with a different email than the one they were invited with (e.g., work email invited, personal email used at signup), the email-match auto-claim fails. The `claimUserCode` in the invitation URL becomes the fallback:
1. Find the PENDING_SIGNUP record by `claimUserCode`
2. Check if the Clerk-provided email already belongs to another ACTIVE User — if yes, reject with an error
3. If clear, link clerkId to the found record and update its `email` to the Clerk-provided email, then proceed with credit conversion

**D. Conflict: email match vs. referral code in the same request**
If a user signs up with an email matching a PENDING_SIGNUP record but also carries a referral code from a different sponsor in the URL, the email match wins. The invitation's original sponsorship is preserved. The referral code is ignored. This prevents a sponsor from poaching an invited user by getting them to use their referral link.

**E. Deactivated real-user accounts blocking new signups**
If an admin deactivates an ACTIVE user (status → INACTIVE, clerkId remains set) and that person later tries to sign in again, Clerk will authenticate them normally. `syncUserFromClerk()` will find them by clerkId (not by email), hit the existing-user path, and the system must decide whether to return an error or silently reactivate. **Recommended:** Return a "account deactivated — contact admin" error. Reactivation must be an explicit admin action.

---

### 4.5 Invitation Credits Lose Their Link to the Invitation Context

**Severity: MEDIUM**

Currently, `InvitationCreditGrant` links to a specific `Invitation.id`. When that invitation is claimed, approved grants convert to real `CreditTransaction` records.

In the combined model:
- Invitation credits would be CreditTransaction records with `userId` pointing to the INVITED user
- The lifecycle becomes: PENDING → APPROVED (admin approved, but user hasn't signed up yet) → COMPLETED (user signed up, credit is real) or VOIDED (invitation canceled)
- This is actually a 4-state lifecycle for one category, while nominations only need 3 states, and spends need 1 state
- The `status` field carries different semantic meanings depending on `category`

Phil Says: credits only need to be PENDING or APPROVED. If the user is still PENDING, then the creits won't show on the leaderboard. I'm not sure what is the problem here.


---

### 4.6 Claim Code vs Referral Code Ambiguity

**Severity: MEDIUM**

The proposed schema has two code fields: `referralCode` and `claimUserCode`. The signup flow must determine which code type is in the URL.

**Current flow:** `/api/referral?referral=CODE` → resolves code → finds sponsor → creates user / claims invitation.

**New flow must differentiate:**
- Is this a `referralCode`? → Create new User with `sponsorId` = code owner
- Is this a `claimUserCode`? → Find INVITED User record, link Clerk account, activate

**Options:**
1. Two different URL parameters (`?referral=X` vs `?claim=Y`) — changes all invitation link URLs
2. Single parameter, check both columns — potential collision risk if codes overlap
3. Different code formats (prefixed) — adds complexity

Phil says: Option 1

---

### 4.7 Invitation Deletion Semantics Change

**Severity: MEDIUM**

Currently: `deleteInvitation()` marks the Invitation as CANCELED and voids its credit grants. The invitation record persists for audit but is functionally deleted.

With combined model: "Deleting" an invitation means changing a User's status to INACTIVE (per 4.3 status reduction). The full cancellation sequence:
1. Set status → INACTIVE
2. Void all PENDING INVITATION_CREDIT CreditTransactions for that userId
3. Null out `claimUserCode` to free the unique slot (the invitation link is now dead)
4. **Null out `email`** to free the unique slot for re-invitation (per 4.4 decision — see concern A)
5. Keep the record for audit purposes (createdAt, sponsorId, name remain)

The INACTIVE record must persist forever if any CreditTransactions reference it (even VOIDED ones are foreign key references). The email-nulling from step 4 means the sponsor can immediately re-invite the same address without any conflict. The tradeoff — losing the email from the audit record — is acceptable since the invitation is dead.

---

### 4.8 Missing Transfer Category Logic

**Severity: LOW**

The requirements state "Users can transfer credits to another user." Transfers need:
- Two CreditTransaction records (negative for sender, positive for receiver)
- A way to link the two sides of a transfer
- No approval required (like spending)
- A TRANSFER category

The proposed schema doesn't include a field to link paired transfer records. Consider adding an optional `relatedTransactionId` or `transferId` field.

Phil Says: Remove the requirement to allow users to transfer credits to each other.

---

### 4.9 Category + Status Enum Explosion

**Severity: MEDIUM**

The combined CreditTransaction table must define which statuses are valid for which categories:

| Category | Valid Statuses | Notes |
|---|---|---|
| NOMINATION | PENDING, APPROVED, REJECTED | Needs admin approval |
| ADMIN_DIRECT | APPROVED | Always immediately applied |
| SPEND | APPROVED | User self-authorized |
| INVITATION_CREDIT | PENDING, APPROVED, CONVERTED, VOIDED | 4-state lifecycle |
| TRANSFER | APPROVED | No approval needed |

This creates implicit business rules that aren't enforced at the database level. A SPEND record should never be PENDING, but nothing prevents it. Application code must enforce these invariants.

Phil Says: The category table is an arbitrary string. It will be used for categories such as "attendance" or "recruting". We plan to group these categories by a pre-defined amount of credits, although the database doesn't need to enforce this. When users are awarding credits, they will select category from a drop-dowwn box which we will define later, and the points will populate according to the catetory.

---

### 4.10 Audit Trail Purity Lost

**Severity: LOW-MEDIUM**

Currently, `CreditTransaction` is a clean financial ledger — every row represents a real balance change. Admin edits (`updateAdminCreditTransaction`, `deleteAdminCreditTransaction`) directly modify this ledger.

With the combined table:
- The table contains both pending requests AND finalized transactions
- It's no longer an immutable ledger — it's a workflow table AND a ledger simultaneously
- Debugging balance discrepancies requires understanding category + status combinations
- Financial auditing becomes harder (need to filter and cross-reference)

PHil Says: CreditTransaction is an acceptable financial ledger for auditing.

---

### 4.11 Sync Flow Complexity in `syncUserFromClerk()`

**Severity: HIGH**

The `syncUserFromClerk()` function is the most complex piece of business logic in the app. It handles 5 scenarios:

1. Existing user by Clerk ID → update
2. Pre-registered user by email → link Clerk account
3. Pre-registered user by pendingUserId → claim invitation + convert credits
4. New user with referral code → create user + claim matching invitation
5. Brand new user without referral → create user

With the combined model, this function changes significantly. The new lookup order must be:

1. **Find by clerkId** → existing user → update name/email, return
2. **Find PENDING_SIGNUP by email** (clerkId IS NULL) → auto-claim → link clerkId, set ACTIVE, null claimUserCode, convert all PENDING INVITATION_CREDIT records → APPROVED (see 4.4 concern B)

   Phil Says: No PRE_APPROVED credits anymore. Just PENDING → APPROVED on claim.

   **Decision: Accepted.** PRE_APPROVED is removed from the `CreditStatus` enum. Invitation credits have a two-state lifecycle: PENDING → APPROVED (on claim) or VOIDED (on cancel). There is no admin pre-approval step for invitation credits. The `invitation-credit-approval-list.tsx` component is removed. The `approverId` field on INVITATION_CREDIT records will always be null.

3. **Find by claimUserCode** (URL parameter) → code-based claim → link clerkId, overwrite email with Clerk-verified email, set ACTIVE, null claimUserCode, convert all PENDING INVITATION_CREDIT → APPROVED

   Phil Says: I'm thinking it would be easier if PENDING and INACTIVE users don't have emails. Would that solve this problem?

   **Feedback:** Removing email from PENDING_SIGNUP records would break the 4.4 requirement — the unique constraint that prevents duplicate invitations relies on the email being stored. Without it, duplicate prevention falls back to application-only logic with no DB guarantee. Email should stay on PENDING_SIGNUP records.

   **The actual simplification:** Step 3 does not need a manual email-collision check. Updating the email on an existing PENDING_SIGNUP row to the Clerk-verified value is an in-place update on the same record. If that new email already belongs to a different record, the DB unique constraint fires automatically with a clear error. No prior application-level check is needed — just attempt the update and catch the constraint violation with an informative message.

4. **Find by referralCode** (URL parameter) → create new ACTIVE User with sponsorId = code owner's id
5. **No match** → create new ACTIVE User with no sponsor

Key changes from current implementation:
- Step 2 is entirely new: email-match auto-claim handles claims automatically when the invitee signs up with the same email they were invited with
- Step 3 replaces the old pendingUserId lookup with claimUserCode; email collision is enforced by the DB unique constraint rather than a manual pre-check
- Credit conversion is simplified: PENDING INVITATION_CREDIT → APPROVED on claim, VOIDED on cancel. No PRE_APPROVED status, no admin approval step for invitation credits.
- Step 2 must run before step 4: if the Clerk email matches a PENDING_SIGNUP record, the referral code in the URL is ignored (see 4.4 concern D)

**Risk:** This is auth-critical code. Bugs here mean users can't sign up, credits are lost, or wrong sponsors are assigned. The refactor requires extremely careful testing of all five signup paths, particularly the interaction between steps 2 and 3 (invitee signs up with a different email than the one they were invited with but holds a valid claim code).

---

### 4.12 Recruit Tree Display Changes

**Severity: MEDIUM**

The recruit tree currently shows only real users. With invitations as User records:
- `getRecruitsTree()` returns all direct recruits. INVITED users would appear in the tree.
- This is actually desirable per requirements ("Pending invitations should appear in sponsor and admin hierarchy views with a clear indication that they have not yet been claimed").
- But every tree-rendering component must handle the display of INVITED vs ACTIVE users differently (visual indicators, disabled actions).
- The recruit tree API endpoint (`/api/recruits/[userId]`) returns users with credit balances — INVITED users with pending credits would show misleading balance numbers unless filtered.

Phil Says: Consider adding a filter to that widget to show/hide pending recruits. All users can use this filter. By default, show only ACTIVE users. Don't show INACTIVE users.

---

### 4.13 Impersonation of Invited Users

**Severity: LOW**

If invitations are User records, can an admin impersonate an INVITED user? This shouldn't be allowed since INVITED users have no Clerk session. The impersonation logic must filter by status.

Phil Says: Admins can impersonate invited users.

---

## 5. Questions and Suggested Answers

### Q1: What categories should the CreditTransaction table support?

**Suggested Answer:** Define a `CreditCategory` enum:
```
NOMINATION        — Sponsor nominates credits for a recruit (requires approval)
ADMIN_DIRECT      — Admin directly creates credit (no approval needed)
SPEND             — User spends credits (no approval needed)
INVITATION_CREDIT — Credits assigned to an invitation before signup (requires approval + conversion)
TRANSFER          — User transfers credits to another user (no approval needed)
SYSTEM            — System-generated credits (attendance, signup bonuses, etc.)
```

Phil Says: We need a table for this. For now, "attendance" is worth one credit and "missed attendance" are worth -1 credit. The table will have 'category' and 'credits' columns. This table should not link to the CreditTransaction table. It is only the pre-defined credits for easy data entry.

---

### Q2: What statuses should the CreditTransaction table support?

**Suggested Answer:** Define a `CreditStatus` enum:
```
PENDING    — Awaiting admin approval (nominations, invitation credits)
APPROVED   — Admin approved; counts toward balance (or: invitation credit approved but not yet converted)
REJECTED   — Admin rejected; does not count toward balance
COMPLETED  — Fully finalized (used for invitation credits after claim conversion)
VOIDED     — Invalidated (invitation canceled, credit grants voided)
```

**However**, this creates ambiguity: for NOMINATION, APPROVED = finalized. For INVITATION_CREDIT, APPROVED = still waiting for invitation claim. Consider whether APPROVED and COMPLETED should be collapsed into one status and INVITATION_CREDIT gets special handling, or if COMPLETED should be the universal "counts toward balance" status.

**Recommended approach:** Use only statuses that affect balance consistently:
- Balance = SUM(amount) WHERE status = 'APPROVED'
- NOMINATION: PENDING → APPROVED (balance-affecting) or REJECTED
- INVITATION_CREDIT: PENDING → APPROVED (but NOT balance-affecting until claimed) is the problem

This reveals the fundamental tension: APPROVED means different things for different categories. Options:
1. For invitation credits, skip APPROVED and go PENDING → COMPLETED (on claim) or VOIDED
2. Add a separate `isFinalized` boolean
3. Accept the complexity and document it

**Recommended: Option 1.** Invitation credits go PENDING → COMPLETED (counts toward balance) or VOIDED. The admin approval step sets an `approverId` but keeps status as PENDING (with an `approvedAt` timestamp or similar marker). This way, all categories follow the same balance rule: only APPROVED or COMPLETED count.

**Decided approach:** `Balance = SUM(amount) WHERE status = 'APPROVED'`. Invitation credits are PENDING until the invitation is claimed, at which point they automatically become APPROVED. There is no admin pre-approval step. Nominations: PENDING → APPROVED or REJECTED (admin action required). Spends, admin directs, system, and transfers: created as APPROVED immediately.

---

### Q3: What UserStatus values are needed with invitations merged into User?

**Suggested Answer:**
```
INVITED         — Invitation created, not yet signed up
PENDING_SIGNUP  — Admin pre-registered; Clerk signup not yet completed
ACTIVE          — Fully registered and active
INACTIVE        — Deactivated by admin
CANCELED        — Invitation was withdrawn before signup
```

Phil Says: PENDING_SIGNUP, ACTIVE and INACTIVE only, unless you see a problem.

---

### Q4: How should the referral code + claim code system work?

**Suggested Answer:**
- `referralCode` — A permanent, unique code for recruiting new users. Generated when the user record is created. Used in shareable links: `/api/referral?referral=CODE`. When someone signs up with this code, they become a new recruit of this user.
- `claimUserCode` — A one-time-use code for invitation claims. Generated when a sponsor creates an invitation (INVITED user record). Used in invitation links: `/api/referral?claim=CODE`. When someone signs up with this code, they take over the existing INVITED user record instead of creating a new one.

**Resolution flow:**
1. Check `claimUserCode` first → if match, claim the INVITED user record
2. Else check `referralCode` → if match, create new user with sponsor
3. Else → create user with no sponsor

**Alternative:** Use a single URL parameter and differentiate by code format (e.g., referral codes are 12-char hex, claim codes are 8-char alphanumeric with a prefix). This avoids changing the URL structure.

Phil Says: Use suggested answer.

---

### Q5: Should referral codes have expiration dates?

**Suggested Answer:** Yes. Add a `referralCodeExpiresAt` column to User. Without expiration:
- Referral codes live forever, which might not be desired
- No mechanism to force code rotation
- The current system uses 365-day expiration by default

For invitation claim codes, they expire when the invitation expires or is canceled (the user's status becomes CANCELED).

Phil Says: No expiration needed.

---

### Q6: How should email uniqueness be handled with INVITED users?

**Decision (Phil, 4.4):** Strict global uniqueness — `email` is `@unique` on the User table, covering all statuses. Only one User record per email address at any time.

**Implementation:** Standard Prisma `@unique` on the email column. No partial index needed. Null emails are excluded from uniqueness checks by default in PostgreSQL (multiple rows can have `email = NULL`), which correctly handles the case where canceled invitation records have their email nulled out.

**Consequence for canceled invitations:** When an invitation is canceled, the email column must be set to NULL to free the slot for re-invitation (see 4.7). This is the only special handling required.

**Consequence for signup:** `syncUserFromClerk()` uses the unique email constraint to its advantage — a simple `findUnique({ where: { email } })` efficiently locates any existing record for auto-claiming (see 4.11).

Phil Says: Inactive users should have e-mail set to null. Pending users will have email set to null.

---

### Q7: How should invitation deletion work in the combined model?

**Suggested Answer:**
1. Change user status from INVITED to CANCELED
2. Void all PENDING CreditTransactions for that user (status → VOIDED)
3. Null out `claimUserCode` to free the unique slot (the link is no longer valid)
4. Keep the record for audit purposes
5. Do NOT null out `referralCode` — the CANCELED user's referral code was never used and can remain allocated

**Problem:** If the sponsor wants to re-invite the same email, and Option A from Q6 is used, the CANCELED record has email set. Since the partial unique index only covers ACTIVE/PENDING_SIGNUP, this works — a new INVITED record with the same email can be created.

Phil Says: Set status to INACTIVE. Null out email and claimUserCode. Keep the record for audit purposes.

---

### Q8: How should the invitation credit flow work?

Phil Says: invidation credit flow will work the same for normal credit flow. PENDING → APPROVED on claim, VOIDED on cancel. No PRE_APPROVED status, no admin approval step for invitation credits.

---

### Q9: What about the `claimUserCode` naming?

**Suggested Answer:** Consider `invitationCode` or `signupCode` as clearer alternatives. The name should communicate its purpose: "use this code to claim this user record during signup."

Phil Says: Signup code is better. Let's rename `claimUserCode` to `signupCode`.

---

### Q10: How should credit transfers be linked?

**Suggested Answer:** Add an optional `relatedTransactionId` field:
```
relatedTransactionId  String?  @unique
```
When user A transfers 10 credits to user B:
- Transaction 1: userId=A, amount=-10, category=TRANSFER, relatedTransactionId=Transaction2.id
- Transaction 2: userId=B, amount=+10, category=TRANSFER, relatedTransactionId=Transaction1.id

This creates a bidirectional link between paired transfer records.

Phil Says: No credit transfers needed. Remove this requirement from the requirements.md.

---

### Q11: Should INVITED users appear in the admin user list?

**Suggested Answer:** Yes, but with clear status indicators. The admin user list already supports filtering by status. Add INVITED and CANCELED to the filter options. By default, show only ACTIVE and PENDING_SIGNUP users. INVITED users should be accessible through an "Invitations" filter/tab.

Phil Says: Yes. Use clear status indicators. Use filters from the database fields.

---

### Q12: What happens to the `/referrals` page?

**Suggested Answer:** With one referral code per user, the `/referrals` page becomes minimal:
- Display the user's single referral code
- Copy-to-clipboard functionality
- Show referral URL

Currently `/referrals` redirects to `/dashboard`. In the new model, the referral code can be displayed directly on the dashboard (as already recommended in the UI analysis). A dedicated referrals page may be unnecessary.

Phil Says: Delete /referrals page.

---

### Q13: Should referral codes be human-readable?

**Suggested Answer:** With one code per user, consider making referral codes user-friendly (e.g., `ALICE-2026` or `user-abc123`) instead of random 12-char hex. This improves shareability. The `claimUserCode` can remain machine-generated since it's only used in links.

Phl Says: use suggested answer

---

## 6. Recommendations for Overall Structure

### 6.1 Proposed Final Schema

```prisma
model User {
  id                    String     @id @default(cuid())
  name                  String
  email                 String?
  clerkId               String?    @unique
  sponsorId             String?
  preferredDisplayName  String?
  role                  UserRole   @default(USER)
  status                UserStatus @default(ACTIVE)
  bio                   String?
  location              String?
  joinedAt              DateTime   @default(now())
  referralCode          String     @unique
  referralCodeExpiresAt DateTime?
  signupCode            String?    @unique
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Self-referential sponsor/recruit hierarchy
  sponsor   User?  @relation("SponsorRecruits", fields: [sponsorId], references: [id])
  recruits  User[] @relation("SponsorRecruits")

  // Credit relations
  creditTransactions          CreditTransaction[] @relation("CreditUser")
  nominatedCreditTransactions CreditTransaction[] @relation("CreditNominator")
  approvedCreditTransactions  CreditTransaction[] @relation("CreditApprover")

  // Impersonation
  impersonationSessionsAsAdmin ImpersonationSession[] @relation("ImpersonationAdmin")
  impersonationSessionsAsUser  ImpersonationSession[] @relation("ImpersonationUser")

  @@index([sponsorId])
  @@index([role])
  @@index([status])
  @@index([referralCode])
  @@index([signupCode])
}

model CreditTransaction {
  id                   String         @id @default(cuid())
  userId               String
  nominatorId          String?
  amount               Int
  description          String
  category             CreditCategory
  status               CreditStatus   @default(PENDING)
  rejectionReason      String?
  approverId           String?
  relatedTransactionId String?        @unique
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt

  user               User               @relation("CreditUser", fields: [userId], references: [id])
  nominator          User?              @relation("CreditNominator", fields: [nominatorId], references: [id])
  approver           User?              @relation("CreditApprover", fields: [approverId], references: [id])
  relatedTransaction CreditTransaction? @relation("TransferPair", fields: [relatedTransactionId], references: [id])
  inverseRelated     CreditTransaction? @relation("TransferPair")

  @@index([userId])
  @@index([category])
  @@index([status])
  @@index([createdAt])
}

model ImpersonationSession {
  id                 String                     @id @default(cuid())
  adminId            String
  impersonatedUserId String
  status             ImpersonationSessionStatus @default(ACTIVE)
  ipAddress          String?
  userAgent          String?
  startedAt          DateTime                   @default(now())
  endedAt            DateTime?

  admin            User @relation("ImpersonationAdmin", fields: [adminId], references: [id])
  impersonatedUser User @relation("ImpersonationUser", fields: [impersonatedUserId], references: [id])

  @@index([adminId])
  @@index([status])
}

enum UserRole {
  USER
  ADMIN
}

enum UserStatus {
  PENDING_SIGNUP
  ACTIVE
  INACTIVE
}

Phil says: Delete CreditCategory. 
enum CreditCategory {
  NOMINATION
  ADMIN_DIRECT
  SPEND
  INVITATION_CREDIT
  TRANSFER
  SYSTEM
}

enum CreditStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ImpersonationSessionStatus {
  ACTIVE
  ENDED
}
```

### 6.2 Status Rules by Category

| Category | Created As | Valid Transitions | Counts in Balance |
|---|---|---|---|
| NOMINATION | PENDING | → APPROVED (admin) or REJECTED (admin) | Only when APPROVED |
| ADMIN_DIRECT | APPROVED | (none, immediately final) | Always |
| SPEND | APPROVED | (none, immediately final) | Always |
| INVITATION_CREDIT | PENDING | → APPROVED (on claim, automatic) or VOIDED (on cancel, automatic) | Only when APPROVED |
| TRANSFER | APPROVED | (none, immediately final) | Always |
| SYSTEM | APPROVED | (none, immediately final) | Always |

**Balance formula:** `SUM(amount) WHERE userId = ? AND status = 'APPROVED'`

### 6.3 User Lifecycle

```
Sponsor creates invitation:
  → User created (status=PENDING_SIGNUP, claimUserCode set, sponsorId set, email set, no clerkId)

Invitee signs up via Clerk with matching email (auto-claim):
  → syncUserFromClerk() finds User by email where clerkId IS NULL
  → clerkId linked, status → ACTIVE, claimUserCode nulled
  → All PENDING INVITATION_CREDIT records → APPROVED

Invitee signs up via Clerk with different email but uses claim code URL:
  → syncUserFromClerk() finds User by claimUserCode
  → Updates email to Clerk-verified email (DB unique constraint catches conflicts)
  → clerkId linked, status → ACTIVE, claimUserCode nulled
  → All PENDING INVITATION_CREDIT records → APPROVED

Someone signs up via referral code (no matching invited record):
  → New User created (status=ACTIVE, clerkId set, sponsorId = code owner)

Someone signs up with no code and no email match:
  → New User created (status=ACTIVE, clerkId set, no sponsorId)

Sponsor cancels invitation:
  → status → INACTIVE
  → All PENDING INVITATION_CREDIT records → VOIDED
  → claimUserCode nulled
  → email nulled (frees slot for re-invitation)

Admin deactivates a real user:
  → status → INACTIVE (clerkId remains set)
  → User cannot sign in — syncUserFromClerk() returns deactivated error
  → Admin must explicitly reactivate
```

---

## 7. Files That Require Changes

### Database Layer (src/lib/db/)

| File | Changes Required |
|---|---|
| `prisma.ts` | No changes |
| `users.ts` (18 functions) | Major rewrite. All user queries must filter by status for "real users". `createUserFromInvitation` becomes a status change. Invitation-related functions merge in. Referral code functions merge in. |
| `credits.ts` (23 functions) | Major rewrite. Balance queries add status filter. Nomination functions merge into credit functions. Invitation credit grant functions merge in. Category field added to all creates. |
| `invitations.ts` (7 functions) | **Delete entirely.** Logic moves into `users.ts` (create invitation = create INVITED user) and `credits.ts` (invitation credit grants become INVITATION_CREDIT transactions). |
| `referral-codes.ts` (5 functions) | **Delete entirely.** Referral code is now a field on User. `createReferralCode` → generated at user creation. `resolveReferralCode` → simple User lookup. |
| `impersonation.ts` | No changes |

### Server Actions (src/actions/)

| File | Changes Required |
|---|---|
| `user-actions.ts` | Minor updates to work with new User fields |
| `credit-actions.ts` | Update to use category field. Nomination creates CreditTransaction with category=NOMINATION |
| `invitation-actions.ts` | Major rewrite. `createInvitationAction` creates a User with status=INVITED. `deleteInvitationAction` changes status to CANCELED. `addInvitationCreditAction` creates CreditTransaction with category=INVITATION_CREDIT |
| `referral-actions.ts` | **Delete entirely** or simplify to code regeneration only |
| `admin-actions.ts` (14 functions) | Update nomination approval to work with combined table. Invitation credit approval uses same table. |

### Auth Layer (src/lib/auth/)

| File | Changes Required |
|---|---|
| `user.ts` | **Critical rewrite** of `syncUserFromClerk()`. Must handle claim code resolution, referral code resolution, invitation credit conversion via status updates. Most complex change in the refactor. |

### API Routes (src/app/api/)

| Route | Changes Required |
|---|---|
| `/api/referral` | Update to handle both `referralCode` and `claimUserCode` lookup |
| `/api/recruits/[userId]` | Update to include/exclude INVITED users appropriately |

### Components (src/components/)

| Component | Changes Required |
|---|---|
| `invitation-form.tsx` | Form now creates a User (INVITED status) instead of Invitation |
| `invitation-credit-form.tsx` | Creates CreditTransaction (INVITATION_CREDIT) instead of InvitationCreditGrant |
| `pending-invitations-section.tsx` | Query changes — invitations are now Users with status=INVITED |
| `nominate-credit-form.tsx` | Minor — adds category=NOMINATION to form submission |
| `spend-credits-form.tsx` | Minor — adds category=SPEND |
| `nomination-approval-list.tsx` | Queries CreditTransaction with category=NOMINATION, status=PENDING |
| `invitation-credit-approval-list.tsx` | Queries CreditTransaction with category=INVITATION_CREDIT, status=PENDING |
| `admin-user-list.tsx` | Add status filters for INVITED/CANCELED users |
| `admin-user-credit-controls.tsx` | Minor updates |
| `recruit-tree.tsx` | Handle display of INVITED users in tree |
| `profile-sidebar-card.tsx` | No changes expected |
| `referral-code-copy.tsx` | Simplify — single code from user record instead of fetching from ReferralCode table |

### Pages

| Page | Changes Required |
|---|---|
| `/dashboard` | Update data fetching — referral code from user, invitations from User query |
| `/credits` | Update credit history query to include category |
| `/invitations` | Major — invitations are User records, credit grants are CreditTransactions |
| `/referrals` | Currently redirects to dashboard; may be removed entirely |
| `/admin` | Update stats queries |
| `/admin/nominations` | Query CreditTransaction by category instead of CreditNomination |
| `/admin/credits` | Minor updates |
| `/admin/invitations` | Query User records with status=INVITED |
| `/admin/users` | Add status filters for invitation statuses |
| `/admin/hierarchy` | Handle INVITED users in tree |
| `/users/[id]` | Handle profile display for INVITED users |
| `/sponsor` | No changes expected |
| Landing page `/` | Update leaderboard raw SQL query |

### Other Files

| File | Changes Required |
|---|---|
| `prisma/schema.prisma` | Complete rewrite per Section 6.1 |
| `prisma/seed.ts` | Rewrite to use new schema |
| `prisma/add-credits.ts` | Update to use category/status fields |
| `src/lib/validation/schemas.ts` | Update schemas for new fields (category, claim code, etc.) |
| `prisma/migrations/` | Delete all existing migrations, generate fresh |

---

## 8. Estimated Scope of Changes

| Area | Files | Severity |
|---|---|---|
| Schema + Migrations | 2 | Full rewrite |
| Database layer (`src/lib/db/`) | 5 | 3 major rewrites, 2 deletions |
| Server actions (`src/actions/`) | 5 | 2 major rewrites, 1 deletion |
| Auth layer | 1 | Critical rewrite |
| API routes | 2 | Moderate updates |
| Components | 12+ | Mixed — some minor, some major |
| Pages | 12+ | Mixed — some minor, some major |
| Seed/utility scripts | 2 | Full rewrite |
| Validation schemas | 1 | Moderate update |
| **Total** | **~40 files** | |

---

## 9. Recommendations (see Section 11 for updated list)

---

## 10. Additional Problems Found During Review

### 10.1 Q6 Contradiction: PENDING_SIGNUP Email

Phil says (Q6): "Pending users will have email set to null." But section 4.4 decides strict global email uniqueness to prevent duplicate invitations. If PENDING_SIGNUP users have null email, duplicate prevention is impossible at the DB level (two sponsors could both invite jane@example.com and neither User record would have the email stored).

**Resolution:** PENDING_SIGNUP users MUST keep their email for duplicate prevention. Only INACTIVE users (canceled invitations, deactivated accounts) get email nulled. Phil's Q6 comment is interpreted as referring to INACTIVE users only.

### 10.2 Invitation Credits Are Just Regular Nominations

Phil says (Q8): "invitation credit flow will work the same for normal credit flow." This means there is no special "invitation credit" category or workflow. Credits for PENDING_SIGNUP users are created exactly like credits for ACTIVE users — as PENDING transactions requiring admin approval. When the admin approves them, they become APPROVED and count toward the user's balance. When the user eventually signs up (status → ACTIVE), those credits are already there.

If the invitation is canceled (user → INACTIVE), any remaining PENDING credits are set to REJECTED (reason: "Invitation canceled"). APPROVED credits remain as audit trail but are inaccessible since the user is INACTIVE.

This eliminates all special invitation credit handling — no separate grant table, no automatic PENDING → APPROVED on claim, no VOIDED status needed.

### 10.3 VOIDED Status Not Needed

Phil removed VOIDED from CreditStatus. With 10.2's resolution (invitation credits = regular nominations), the only terminal states are APPROVED and REJECTED. When an invitation is canceled, PENDING credits become REJECTED. No VOIDED status required.

### 10.4 Stale Artifacts in Proposed Schema (Section 6.1)

The schema in section 6.1 still includes:
- `referralCodeExpiresAt` — Phil said no expiration needed (Q5)
- `relatedTransactionId` / `TransferPair` relation — Phil said no transfers (Q10)
- `CreditCategory` enum — Phil said delete it; category is a free-text string (Q1)

These are removed in the actual implementation.

### 10.5 CreditCategory Lookup Table Definition

Phil wants a CreditCategory lookup table (Q1) for predefined categories with default credit amounts (e.g., "attendance" = 1, "missed attendance" = -1). This table is decoupled from CreditTransaction — it's only used for UI dropdowns to auto-populate amounts. The `category` field on CreditTransaction is a plain String that may or may not match a CreditCategory name.

### 10.6 Admin User List Status Filter Missing PENDING_SIGNUP

The admin user list status filter only shows "Active" and "Inactive" options. With PENDING_SIGNUP users now being the invitations, this filter needs a third option to find pending invitations.

---

## 11. Recommendations

### 11.1 Accept the Refactor, But Add Safeguards

The consolidation genuinely simplifies the conceptual model. The current 6-table design has a lot of ceremony around Invitation ↔ InvitationCreditGrant ↔ CreditTransaction ↔ CreditNomination linkage that creates N+1 query patterns and complex join logic. But the refactor must be done carefully:

1. **Create a `getCreditBalance()` helper and use it everywhere.** Never write inline balance queries. The status filter must be centralized.
2. **Add database-level constraints** via check constraints or triggers to enforce valid category+status combinations.
3. **Write comprehensive tests** for the `syncUserFromClerk()` flow before and after the refactor.

### 11.2 Consider Keeping Two Credit Tables

An alternative to fully combining: keep `CreditTransaction` as the clean finalized ledger (no status, no pending records), and merge CreditNomination + InvitationCreditGrant into a `CreditRequest` table. When a request is approved, it creates a CreditTransaction. This preserves the clean balance calculation while still simplifying the approval workflow.

**Pros:** Balance = SUM(amount) with no filter. Ledger integrity preserved.
**Cons:** Still two credit tables, though simpler than three.

### 11.3 Consider Adding Referral Code Expiration

Add `referralCodeExpiresAt` to User. Without it, referral codes are permanent, which may not be desired.

### 11.4 Use Separate URL Parameters for Code Types

Use `/api/referral?referral=CODE` for general referrals and `/api/referral?claim=CODE` for invitation claims. This is explicit, avoids collision, and makes the signup flow easier to reason about.

### 11.5 Add a `realUserCount` View or Materialized Filter

Since many queries will need "only real users" (status IN ACTIVE, INACTIVE, PENDING_SIGNUP), consider creating a database view or a utility function that abstracts this filter to avoid repetition.

### 11.6 Plan the Refactor in Phases

**Phase 1:** Schema change + database layer + auth
**Phase 2:** Server actions + API routes
**Phase 3:** Components + pages
**Phase 4:** Seed data + testing

Each phase should be testable independently by running `npx tsc --noEmit` and verifying no type errors.
