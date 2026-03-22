# Referral And Credits Platform Requirements

## Confirmed Requirements

### Roles And Permissions

- The system has two roles for now: regular user and administrator.
- Administrators can view a list of all users and their roles.
- Administrators can grant administrator privileges to users and remove administrator privileges from users.
- More roles may be added later, but they are out of scope for the first version.

### Admin Access And Troubleshooting

- Administrators can impersonate users for troubleshooting and support purposes.
- Impersonation is a persistent switched-user session that continues across multiple pages and requests until the administrator explicitly exits impersonation.
- Actions taken during impersonation persist normally in the system.
- The system should preserve a clear path for the administrator to stop impersonating and return to their own administrator session.
- Administrator impersonation should have a lightweight internal audit trail for recordkeeping purposes only.
- The impersonation audit trail should not add noticeable friction to the workflow for administrators or users.

### User Relationship Model

- Each user can act as both a sponsor and a recruit.
- A user can have exactly one sponsor.
- A user can have many recruits.
- Sponsor assignment is optional.
- The database should model this as a self-referential one-to-many user relationship.
- If a user signs up without a sponsor, they can assign their own sponsor from a searchable list of eligible sponsors.
- User self-assignment of a sponsor should be a one-time action unless an administrator later changes the sponsor.
- Administrators can change a user's sponsor after signup.

### Referral Links And Referral Codes

- Users can generate referral links that are unique to them.
- The referral link format should be `https://example.com/signup?referral=UNIQUE_CODE`.
- If a new user signs up with a referral link, they become a recruit of the user associated with that referral code.
- Referral codes created in this way can be used multiple times.

### Invitations

- Sponsors can create invitations for people who have not signed up yet.
- An invitation stores name and email before signup is completed.
- Each invitation has a referral link in the format `https://example.com/signup?referral=UNIQUE_CODE`.
- An invitation is not a real authenticated user account and cannot sign in.
- The invited person must use the invitation or referral link and complete signup through Clerk to become a real user.
- After successful signup, the system creates the local user record, links it to the sponsoring user, and deletes the invitation.
- If a user signs up without using an invitation or referral link, they start without a sponsor unless they later self-assign one or an administrator assigns one.
- When an invited person signs up using that link, they become a recruit of the sponsor who created the invitation.
- Invitation links cannot be used after the invitation has been claimed.
- Sponsors can view their pending invitations.
- Sponsors can delete invitations that have not yet been claimed.
- Pending invitations should appear in sponsor and admin hierarchy views with a clear indication that they have not yet been claimed.

### Credits Data Model

- The database should contain a credits table.
- Each credit record should include at least:
	- `user_id`
	- `amount`
	- `description`
	- `timestamp`
	- `nominator_id` for the user who caused the credit to be awarded
	- `approver_id` for the administrator who approved the credit
- Credits support both positive and negative amounts.
- Positive credits represent rewards or awards.
- Negative credits represent spending or deductions.
- The system should also support credits assigned to invitations before signup.
- Invitation credits are not part of any user's balance and cannot be spent before the invitation is claimed.
- When an invitation is claimed and a user account is created, approved invitation credits are converted into normal user credit transactions for that user.
- If an invitation is deleted, canceled, expires, or is never claimed, its unconverted invitation credits are voided and never transferred to a user.
- Negative adjustments should be represented through `CreditTransaction` records.
- Negative credit transactions do not require a separate category field if the description captures the reason clearly.

### Credit Nominations And Approval

- Sponsors can nominate credits for any user in their downline.
- Credit nominations must be approved by an administrator before they are awarded.
- Administrators can approve or reject credit nominations.
- Users can spend credits without administrator approval.
- Administrators should have a list of all unapproved credit nominations.
- The admin approval interface should support selecting multiple nominations with checkboxes and approving the selected items in bulk.
- Credits assigned to invitations should follow the same nomination, approval, and audit rules as credits assigned to users.
- Rejected nominations should remain visible in history.
- Rejected nominations should include a rejection reason visible to the nominator.

### Credit Administration And User Credit History

- Users can view their current credit balance.
- Users can view a history of credits awarded and spent.
- Administrators can create, update, and delete credit records for any user.
- Administrators can directly create positive or negative credits without a nomination.
- An administrator can be both the nominator and the approver for an administrator-created credit.

### Hierarchical Views

- Sponsors can view their recruit hierarchy.
- Administrators can view the full user hierarchy showing sponsors and recruits.
- Hierarchical views should use an expandable tree rather than a fixed-depth static list.

### UI Scope

- The first version should include both a user-facing UI and an administrator UI.
- This is not a backend-only first phase.
- Notifications and emails are out of scope for the first version.

## Derived Requirements And Implementation Notes

### Core Domain Entities

- The system will likely require at minimum the following entities:
	- `User`
	- `ReferralCode`
	- `Invitation`
	- `InvitationCreditGrant`
	- `CreditTransaction`
	- `CreditNomination`
	- `ImpersonationSession` or equivalent admin impersonation audit record
- `User` should support a self-referential sponsor relationship.
- `CreditTransaction` and `CreditNomination` should be modeled separately because nominations require approval while spending does not.
- `InvitationCreditGrant` should remain separate from the real user credit ledger and should convert into user credit transactions only when the invitation is claimed.

### Role Behavior

- Every authenticated user is a regular user unless explicitly marked as an administrator.
- Administrator capabilities should be enforced on the server, not only hidden in the UI.
- Impersonation must be restricted to administrators.
- When impersonation is active, the system should retain both identities for authorization and audit purposes: the acting administrator and the impersonated user.
- Impersonation audit records should include at least the acting administrator ID, impersonated user ID, start time, end time, and session status.
- IP address and user agent may be recorded at session start if they are easy to capture.

### Referral Behavior

- Referral codes must resolve to exactly one sponsoring user.
- A signup flow that uses a referral code should persist enough information to attribute the recruit to the correct sponsor.
- Because multiple active referral codes are allowed per user, referral codes should be first-class records rather than a single field on the user.
- Invitation records and completed user records should be treated as separate lifecycle states to avoid treating invites as real accounts.
- Claiming an invitation should consume that invitation so it cannot be reused.
- Referral codes should have an expiration date, even if that date is typically far in the future.

### User Profile Behavior

- User profiles for the first version should include:
	- `name`
	- `email`
	- optional `bio`, editable by the user
	- optional `preferredDisplayName`
	- optional `location` as a simple text field
- User-related system fields should also include at least `joinedAt`, `sponsorId`, `status`, `createdAt`, and `updatedAt`.
- Phone numbers, street addresses, and avatar uploads are out of scope for the first version.

### Credit Behavior

- A user's visible credit balance should be derived from the sum of credit transactions rather than stored as a manually edited balance field unless caching is later required.
- Positive award transactions and negative spend transactions should both appear in the user-visible history.
- Approval logic applies to nominations, not to all credit-related actions.
- Invitation credits are a pending promise, not actual spendable balance.
- Only `CreditTransaction` records tied to a real user should affect a user's visible balance.
- When invitation credits are claimed, the system should create normal user credit transactions and mark the invitation credits as converted for audit purposes.
- When invitation credits are never claimed, they should remain in history with a terminal state such as voided, canceled, or expired.
- Credit redemptions are expected to support cryptocurrency in the future, but the detailed redemption workflow is intentionally deferred.

### Admin Workflows

- The admin area needs at least these workflows:
	- Manage users and admin role assignments
	- Start impersonation for a selected user
	- Exit impersonation and return to the original administrator session
	- View the full sponsor and recruit tree
	- Review pending credit nominations
	- Approve selected nominations in bulk
	- Manually create, edit, and delete credit transactions
	- Review invitation credit grants and their claim status
	- Reassign a user's sponsor
	- Filter the user list by role, sponsor, referral status, pending nominations, credit balance, signup status, and active/inactive status

### User Workflows

- The user area needs at least these workflows:
	- View personal profile and sponsor relationship
	- Generate referral codes and referral links
	- Create invitations
	- Assign credits to invitations
	- View pending invitations
	- Delete unclaimed invitations
	- Self-assign a sponsor from a searchable eligible-sponsor list if no sponsor is currently assigned
	- View recruit hierarchy
	- Nominate credits for downline recruits
	- View personal credit balance and transaction history
	- Spend credits

### Open Design Risks

- The exact relationship between an invitation and the eventual signed-up user must be defined clearly to avoid duplicate users.
- Sponsor reassignment rules may affect reporting, historical attribution, and tree consistency unless historical snapshots are defined.
- Credit spending needs clear business rules to avoid conflicts between redemptions, adjustments, and administrator edits.
- Invitation credit conversion must be idempotent so credits cannot be created twice if signup callbacks or claim flows retry.

## Remaining Questions To Answer

Fill in the answers directly below each question.

### 1. Credit Spending Workflow Details

Question: Credits may eventually be redeemable for cryptocurrency, but what should the first implemented spend flow actually be? Should spending remain disabled in v1, or should there be a simple manual redemption flow before full crypto support exists?

Answer: Keep it simple for now with future design consideration later.

