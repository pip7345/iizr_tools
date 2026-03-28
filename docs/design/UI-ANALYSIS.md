# UI Analysis: Pages, Use Cases, and Usability Recommendations

## 1. Page Inventory

| # | Route | Page Name | Access | Description |
|---|-------|-----------|--------|-------------|
| 1 | `/` | Landing / Marketing | Public | Hero section, platform stats, how-it-works, leaderboard, CTA buttons |
| 2 | `/sign-in` | Sign In | Public | Clerk-hosted sign-in with redirect to `/dashboard` |
| 3 | `/sign-up` | Sign Up | Public | Clerk-hosted sign-up; stores `?referral=CODE` in cookie for sponsor attribution |
| 4 | `/dashboard` | Dashboard | Authenticated | Stats overview (balance, recruits, codes, pending invitations), profile summary, recent recruits |
| 5 | `/profile` | Edit Profile | Authenticated | Edit display name, bio, location |
| 6 | `/credits` | Credits | Authenticated | View balance, spend credits, nominate credits to recruits, view transaction history and nomination status |
| 7 | `/invitations` | Invitations | Authenticated | Create invitations, view/delete pending invitations, share invitation links, grant credits to invitees |
| 8 | `/referrals` | Referral Codes | Authenticated | Generate referral codes, copy share links, view expiration, delete codes |
| 9 | `/recruits` | Recruit Tree | Authenticated | Interactive expandable tree of all recruits with balances and counts |
| 10 | `/sponsor` | Assign Sponsor | Authenticated (no sponsor) | One-time searchable sponsor picker; redirects to dashboard if sponsor already assigned |
| 11 | `/users/[id]` | User Profile | Authenticated | Public profile (name, role, stats, bio, recruits tree); credit history visible only to profile owner |
| 12 | `/admin` | Admin Dashboard | Admin | Overview stats (total users, active, admins, pending approvals), links to admin tools |
| 13 | `/admin/users` | Admin User List | Admin | Search/filter users, grant/revoke admin, impersonate, remove sponsor |
| 14 | `/admin/credits` | Admin Credits | Admin | Directly create positive or negative credit transactions for any user |
| 15 | `/admin/hierarchy` | Admin Hierarchy | Admin | Full system tree from root users; pending invitation summaries |
| 16 | `/admin/invitations` | Admin Invitations | Admin | View all pending invitations across all sponsors |
| 17 | `/admin/nominations` | Admin Nominations | Admin | Approve/reject user credit nominations (bulk) and invitation credit grants |

---

## 2. User Types

### Regular User
An authenticated user who signed up through Clerk. May or may not have a sponsor. Can act as a sponsor to recruits they bring in.

### Administrator
A regular user who has been granted the `ADMIN` role. Has access to all regular user features plus the admin panel. Can impersonate other users, manage roles, approve credits, and view the full system hierarchy.

---

## 3. Use Cases by User Type

### Regular User Use Cases

| # | Use Case | Pages Used | Description |
|---|----------|------------|-------------|
| U1 | Sign up and join the network | `/sign-up`, `/sponsor` | Register an account, optionally via referral link; assign a sponsor |
| U2 | View dashboard overview | `/dashboard` | See balance, recruits, codes, and pending invitations at a glance |
| U3 | Edit profile | `/profile` | Update display name, bio, and location |
| U4 | Generate and share referral codes | `/referrals` | Create referral links to recruit new users |
| U5 | Invite specific people | `/invitations` | Send invitations with name/email, share link, optionally grant pre-signup credits |
| U6 | Grant credits to invitations | `/invitations` | Add credit grants to pending invitations (requires admin approval) |
| U7 | View recruit hierarchy | `/recruits` | Visualize the tree of direct and indirect recruits |
| U8 | View credit balance and history | `/credits`, `/users/[id]` (own) | Check balance, review awarded and spent credits |
| U9 | Spend credits | `/credits` | Deduct credits from balance with a description |
| U10 | Nominate credits for recruits | `/credits`, `/recruits`, `/users/[id]` | Propose credits for a downline user (needs admin approval) |
| U11 | View other users' profiles | `/users/[id]` | See public info, credit score, recruit tree of any user |
| U12 | Assign a sponsor | `/sponsor` | One-time self-assignment from searchable list |
| U13 | Transfer credits to another user | `/credits` | Move credits between accounts |

### Administrator Use Cases

| # | Use Case | Pages Used | Description |
|---|----------|------------|-------------|
| A1 | View admin overview | `/admin` | Platform stats and quick links |
| A2 | Manage user roles | `/admin/users` | Grant or revoke admin privileges |
| A3 | Impersonate a user | `/admin/users`, `/users/[id]` | Troubleshoot as another user; banner shows during impersonation |
| A4 | Approve/reject credit nominations | `/admin/nominations` | Review and act on pending nominations individually or in bulk |
| A5 | Approve/reject invitation credit grants | `/admin/nominations` | Review pre-signup credit grants assigned to invitations |
| A6 | Directly create credit transactions | `/admin/credits` | Award or deduct credits for any user without nomination flow |
| A7 | View full system hierarchy | `/admin/hierarchy` | See all sponsor-recruit relationships from root nodes down |
| A8 | View all pending invitations | `/admin/invitations` | Monitor invitations across all sponsors |
| A9 | Reassign or remove a user's sponsor | `/admin/users` | Correct sponsor assignments |
| A10 | Search and filter users | `/admin/users` | Find users by name, email, role, status |

---

## 4. Use Case Priority Ranking (Lowest to Highest Importance)

The ranking below is based on frequency of use, impact on the core platform loop (recruit → nominate → approve → earn), and how many users are affected.

### Lowest Importance (Nice-to-Have / Infrequent)

| Rank | Use Case | Rationale |
|------|----------|-----------|
| 1 | U3 — Edit profile | Done once or rarely; not part of core loop |
| 2 | U12 — Assign sponsor | One-time action; most users arrive via referral link and never need this page |
| 3 | A9 — Reassign sponsor | Rare admin correction |
| 4 | A8 — View all invitations (admin) | Informational only; no actions available on this page |
| 5 | U13 — Transfer credits | Low frequency; not yet a primary spending mechanism |

### Medium Importance (Supporting Features)

| Rank | Use Case | Rationale |
|------|----------|-----------|
| 6 | U11 — View other users' profiles | Useful for trust and discovery, but not a direct action driver |
| 7 | A7 — Full system hierarchy | Important for oversight but used for spot checks, not daily work |
| 8 | U9 — Spend credits | Important long-term (crypto redemption), but limited utility in v1 |
| 9 | A10 — Search/filter users | Admin utility; becomes critical at scale |
| 10 | A6 — Direct credit transactions | Admin escape hatch; used when nomination flow is insufficient |
| 11 | U8 — View credit balance/history | Users check this regularly; trust and transparency driver |
| 12 | A2 — Manage user roles | Low frequency but high impact when needed |
| 13 | A1 — Admin overview | Quick health check of the platform |

### Highest Importance (Core Loop / Daily Drivers)

| Rank | Use Case | Rationale |
|------|----------|-----------|
| 14 | U7 — View recruit hierarchy | Core visibility into one's network; motivates further recruitment |
| 15 | U6 — Grant credits to invitations | Enables pre-signup incentivization |
| 16 | A3 — Impersonate user | Critical for support and troubleshooting |
| 17 | U2 — View dashboard | Most visited page; hub for all activity |
| 18 | U5 — Invite specific people | Primary onboarding mechanism for targeted recruitment |
| 19 | U4 — Generate and share referral codes | Primary onboarding mechanism for broad recruitment |
| 20 | U10 — Nominate credits for recruits | Core engagement loop; sponsors rewarding their network |
| 21 | A4 — Approve/reject nominations | Gatekeeper action; blocks the entire credits flow if delayed |
| 22 | A5 — Approve/reject invitation credits | Same as above for pre-signup credits |
| 23 | U1 — Sign up and join | Without this, nothing else works; must be frictionless |

---

## 5. Usability Recommendations

### 5.1 Navigation & Information Architecture

**Problem**: The top navigation shows 6 links (Dashboard, Referrals, Invitations, Credits, Recruits, Admin) with equal visual weight. Users see everything at once regardless of what matters most right now.

**Recommendations**:
- **Combine Referrals and Invitations into a single "Grow" or "Recruit" page** with tabs. Both pages serve the same goal: bringing new users into the network. Separating them forces users to remember which page does what.
- **Make the top nav contextual**: Highlight the nav item that needs attention (e.g., badge on "Credits" when there are pending nominations, badge on admin link when approvals are waiting).
- **Add notification badges** to the nav for pending items: unapproved nominations (admin), pending invitations, unclaimed referral links.

### 5.2 Dashboard Improvements

**Problem**: The dashboard shows static stats but doesn't drive action. Users see numbers but aren't guided toward what to do next.

**Recommendations**:
- **Add an action-oriented "What to do next" section** with contextual prompts:
  - "You have no recruits yet — share your referral link" (with a one-click copy button right on the dashboard)
  - "You have 3 recruits who earned credits — nominate them for rewards"
  - "You haven't set a sponsor yet — choose one now"
  - Admin: "5 nominations waiting for approval"
- **Surface the user's referral link directly on the dashboard** with a copy button. Currently users must navigate to `/referrals`, generate a code, then copy. This is the single most important user action and should be one click from the dashboard.
- **Show recent activity feed** instead of just "recent recruits": new recruits, credits received, nominations approved/rejected, invitations claimed.

### 5.3 Onboarding Flow

**Problem**: New users land on the dashboard with zero context. There is no guided onboarding explaining what to do first.

**Recommendations**:
- **Add a first-time user checklist** on the dashboard:
  1. ✅ Sign up
  2. ☐ Complete your profile (display name, bio)
  3. ☐ Choose a sponsor (if not assigned via referral)
  4. ☐ Generate your first referral code
  5. ☐ Invite your first recruit
- **Dismiss the checklist** once all steps are complete or manually closed.
- **Auto-redirect new users without a sponsor** to the sponsor selection page with a clear explanation of why it matters, rather than relying on them finding `/sponsor` on their own.

### 5.4 Credits Page Restructure

**Problem**: The credits page combines three distinct concerns in one view: spending, nominating, and history. The forms compete for attention.

**Recommendations**:
- **Use tabs or sections with clear headings**: "My Balance", "Nominate a Recruit", "Spend Credits", "Transaction History".
- **Lead with the balance prominently** at the top, then show history. Move the nomination form to the recruit tree or profile pages where context is richer (the user can see WHO they're nominating).
- **Inline nomination on the recruit tree** (already partially implemented via the "Nominate tokens" button) should be the primary nomination path. The credits page form should be secondary or removed to reduce duplication.

### 5.5 Invitation Workflow Simplification

**Problem**: Creating an invitation and granting credits to it are separate steps on the same page but not visually connected in a clear flow.

**Recommendations**:
- **Add optional credit grant fields directly in the invitation creation form** so sponsors can create an invitation with initial credits in one action instead of two.
- **Show a status timeline** for each invitation: Created → Credits Granted → Link Shared → Claimed (or Expired/Deleted). This gives sponsors visibility into their pipeline.

### 5.6 Admin Workflow Efficiency

**Problem**: The admin nominations page is the highest-frequency admin page but requires navigating through the admin dashboard first.

**Recommendations**:
- **Add a direct "Pending Approvals" link** in the main navigation (visible only to admins) or show a notification badge count on the Admin link. Admins should reach the approval queue in one click.
- **Add approve/reject actions to the admin dashboard** for the most recent pending items, so admins can handle quick approvals without navigating to a separate page.
- **Combine Admin Invitations and Admin Nominations** into a single "Approvals" page with tabs, since both involve reviewing and approving pending items.

### 5.7 Mobile Responsiveness

**Problem**: The navigation bar has 6+ links that will overflow on small screens. The current layout relies on horizontal nav that doesn't adapt well.

**Recommendations**:
- **Implement a hamburger menu or bottom tab bar** for mobile. Prioritize the 3 most important links: Dashboard, Credits, Recruits.
- **Stack the dashboard stat cards vertically** on mobile rather than relying on a grid that may feel cramped.
- **Ensure the recruit tree is usable on touch devices** with appropriately sized tap targets for expand/collapse.

### 5.8 Reduce Page Count / Consolidate

**Problem**: There are 11 authenticated user pages and 6 admin pages. Some serve narrow purposes that could be combined.

**Specific consolidation suggestions**:

| Current Pages | Recommendation |
|--------------|----------------|
| `/referrals` + `/invitations` | Merge into a single "Grow Your Network" page with tabs: Referral Codes, Invitations |
| `/profile` + `/sponsor` | Move sponsor assignment into the profile page as a section (editable by user if unset, or by admin) |
| `/admin/invitations` + `/admin/nominations` | Merge into "Approvals" with tabs: Nominations, Invitation Credits, Pending Invitations |
| `/admin/hierarchy` + `/recruits` | Already use the same `RecruitTree` component; admin version just shows all roots. Consider a single hierarchy page with admin toggle to show full tree |

This would reduce user navigation from **7 main nav items** to **5**: Dashboard, Network (referrals + invitations), Credits, Recruits, Profile — with Admin as a 6th for admins.

### 5.9 Empty States

**Problem**: Pages like Recruits, Credits History, and Invitations will show empty tables/trees for new users with no guidance on what to do.

**Recommendations**:
- **Add illustrated empty states** with clear CTAs: "No recruits yet — share your referral link to start building your network" with a button to go to Referrals.
- **Credits history empty state**: "No transactions yet. Earn credits by getting nominated by your sponsor."
- **Recruits tree empty state**: "Your network starts here. Invite someone to get started." with a link to Invitations.

### 5.10 Leaderboard Visibility

**Problem**: The requirements call for a leaderboard on the landing page, but it's only visible to anonymous/unauthenticated users on the marketing page. Authenticated users who go to `/` see the marketing page but typically live on `/dashboard`.

**Recommendations**:
- **Add a leaderboard widget or link on the dashboard** so authenticated users can see rankings without navigating to the public site.
- **Consider a dedicated `/leaderboard` page** accessible from the main nav that shows a richer, sortable leaderboard with filters (time period, region, direct recruits only vs. full downline).

### 5.11 Feedback and Confirmation

**Problem**: Actions like nomination rejection, invitation deletion, and sponsor impersonation have significant consequences but may lack sufficient confirmation.

**Recommendations**:
- **Add confirmation dialogs** for destructive actions: deleting invitations, rejecting nominations, revoking admin access.
- **Show toast notifications** for successful actions (credit spent, nomination submitted, invitation created) rather than relying on inline form messages that may be missed after a page refresh.
- **Display rejection reasons** prominently to nominators so they understand why a nomination was rejected and can resubmit with corrections.

### 5.12 Quick Actions Shortcut

**Recommendation**: Add a floating action button (FAB) or command palette (Ctrl+K) with the top 3 user actions:
1. Copy referral link
2. Create invitation
3. Nominate credits

This eliminates navigation friction for the most common tasks.

---

## 6. Summary: Priority Action Items

Listed from highest to lowest impact on usability:

1. **Add action prompts and referral link copy button to dashboard** — drives the core recruitment loop from the most-visited page
2. **Add notification badges to navigation** — ensures admins and sponsors don't miss pending items
3. **Implement first-time onboarding checklist** — reduces new user confusion and increases activation
4. **Consolidate Referrals + Invitations into one page** — reduces cognitive load and page count
5. **Consolidate Admin Nominations + Invitations into one Approvals page** — streamlines admin workflow
6. **Add empty states with CTAs** — guides users when pages have no data
7. **Add confirmation dialogs for destructive actions** — prevents accidental data loss
8. **Implement mobile-friendly navigation** — ensures usability across devices
9. **Add leaderboard visibility for authenticated users** — drives engagement and competition
10. **Move inline nomination to recruit tree as primary path** — puts the action where the context is
