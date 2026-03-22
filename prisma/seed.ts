import { PrismaPg } from "@prisma/adapter-pg";
import {
  ImpersonationSessionStatus,
  InvitationCreditStatus,
  InvitationStatus,
  NominationStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const adapter = new PrismaPg({
  connectionString:
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/iizr_tools",
});

const prisma = new PrismaClient({ adapter });

// ─── Helpers ───────────────────────────────────────────────────────────────

function clerkId(n: number) {
  return `user_demo_${String(n).padStart(6, "0")}`;
}

function referralCode(prefix: string) {
  return `${prefix.toUpperCase()}-DEMO`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Seed ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding database with demo data...");

  // ── 1. Users ──────────────────────────────────────────────────────────

  // Admin (root of the tree, no sponsor)
  const admin = await prisma.user.upsert({
    where: { clerkId: clerkId(1) },
    update: {},
    create: {
      clerkId: clerkId(1),
      email: "alice.morgan_demo@example.com",
      name: "Alice Morgan_demo",
      preferredDisplayName: "alice_demo",
      bio: "Platform founder and administrator.",
      location: "San Francisco, CA",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      joinedAt: daysAgo(365),
      createdAt: daysAgo(365),
    },
  });

  // Tier-1 sponsors (sponsored by admin)
  const tier1 = await Promise.all(
    [
      {
        n: 2,
        name: "Bob Chen_demo",
        display: "bchen_demo",
        email: "bob.chen_demo@example.com",
        location: "Austin, TX",
      },
      {
        n: 3,
        name: "Carmen Diaz_demo",
        display: "cdiaz_demo",
        email: "carmen.diaz_demo@example.com",
        location: "Miami, FL",
      },
      {
        n: 4,
        name: "David Kim_demo",
        display: "dkim_demo",
        email: "david.kim_demo@example.com",
        location: "Seattle, WA",
      },
    ].map(({ n, name, display, email, location }) =>
      prisma.user.upsert({
        where: { clerkId: clerkId(n) },
        update: {},
        create: {
          clerkId: clerkId(n),
          email,
          name,
          preferredDisplayName: display,
          location,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          sponsorId: admin.id,
          joinedAt: daysAgo(300 - n * 10),
          createdAt: daysAgo(300 - n * 10),
        },
      })
    )
  );

  // Tier-2 users (each sponsored by a tier-1)
  const tier2Defs = [
    { n: 5,  name: "Eva Torres_demo",   display: "etorres_demo",   email: "eva.torres_demo@example.com",    location: "Denver, CO",     sponsorIdx: 0 },
    { n: 6,  name: "Frank Lee_demo",    display: "flee_demo",      email: "frank.lee_demo@example.com",     location: "Chicago, IL",    sponsorIdx: 0 },
    { n: 7,  name: "Grace Patel_demo",  display: "gpatel_demo",    email: "grace.patel_demo@example.com",   location: "Boston, MA",     sponsorIdx: 1 },
    { n: 8,  name: "Henry Brown_demo",  display: "hbrown_demo",    email: "henry.brown_demo@example.com",   location: "Portland, OR",   sponsorIdx: 1 },
    { n: 9,  name: "Isla Martin_demo",  display: "imartin_demo",   email: "isla.martin_demo@example.com",   location: "Nashville, TN",  sponsorIdx: 2 },
    { n: 10, name: "Jake Wilson_demo",  display: "jwilson_demo",   email: "jake.wilson_demo@example.com",   location: "Phoenix, AZ",    sponsorIdx: 2 },
  ];

  const tier2 = await Promise.all(
    tier2Defs.map(({ n, name, display, email, location, sponsorIdx }) =>
      prisma.user.upsert({
        where: { clerkId: clerkId(n) },
        update: {},
        create: {
          clerkId: clerkId(n),
          email,
          name,
          preferredDisplayName: display,
          location,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          sponsorId: tier1[sponsorIdx].id,
          joinedAt: daysAgo(200 - n * 5),
          createdAt: daysAgo(200 - n * 5),
        },
      })
    )
  );

  // Tier-3 users (deeper tree)
  const tier3Defs = [
    { n: 11, name: "Karen White_demo",   display: "kwhite_demo",   email: "karen.white_demo@example.com",   location: "Atlanta, GA",    sponsorIdx: 0 },
    { n: 12, name: "Liam Nguyen_demo",   display: "lnguyen_demo",  email: "liam.nguyen_demo@example.com",   location: "Las Vegas, NV",  sponsorIdx: 1 },
    { n: 13, name: "Mia Clark_demo",     display: "mclark_demo",   email: "mia.clark_demo@example.com",     location: "Houston, TX",    sponsorIdx: 2 },
    { n: 14, name: "Noah Davis_demo",    display: "ndavis_demo",   email: "noah.davis_demo@example.com",    location: "New York, NY",   sponsorIdx: 3 },
    { n: 15, name: "Olivia Scott_demo",  display: "oscott_demo",   email: "olivia.scott_demo@example.com",  location: "Charlotte, NC",  sponsorIdx: 4, status: UserStatus.INACTIVE },
    { n: 16, name: "Paul Adams_demo",    display: "padams_demo",   email: "paul.adams_demo@example.com",    location: "Detroit, MI",    sponsorIdx: 5 },
  ];

  const tier3 = await Promise.all(
    tier3Defs.map(({ n, name, display, email, location, sponsorIdx, status }) =>
      prisma.user.upsert({
        where: { clerkId: clerkId(n) },
        update: {},
        create: {
          clerkId: clerkId(n),
          email,
          name,
          preferredDisplayName: display,
          location,
          role: UserRole.USER,
          status: status ?? UserStatus.ACTIVE,
          sponsorId: tier2[sponsorIdx].id,
          joinedAt: daysAgo(100 - n),
          createdAt: daysAgo(100 - n),
        },
      })
    )
  );

  const allUsers = [admin, ...tier1, ...tier2, ...tier3];
  console.log(`  ✓ ${allUsers.length} users`);

  // ── 2. Referral Codes ─────────────────────────────────────────────────

  const refCodeDefs = [
    { user: admin,    prefix: "ALICE" },
    { user: tier1[0], prefix: "BOB"   },
    { user: tier1[1], prefix: "CARM"  },
    { user: tier1[2], prefix: "DAVE"  },
    { user: tier2[0], prefix: "EVA"   },
    { user: tier2[1], prefix: "FRANK" },
    { user: tier2[2], prefix: "GRACE" },
    { user: tier2[3], prefix: "HENRY" },
  ];

  const refCodes = await Promise.all(
    refCodeDefs.map(({ user, prefix }) =>
      prisma.referralCode.upsert({
        where: { code: referralCode(prefix) },
        update: {},
        create: {
          code: referralCode(prefix),
          userId: user.id,
          expiresAt: daysFromNow(180),
        },
      })
    )
  );
  console.log(`  ✓ ${refCodes.length} referral codes`);

  // ── 3. Invitations ────────────────────────────────────────────────────

  // Claimed invitation — tier2[0] (Eva) was invited by admin
  const inv1 = await prisma.invitation.upsert({
    where: { id: "inv_demo_001" },
    update: {},
    create: {
      id: "inv_demo_001",
      name: "Eva Torres_demo",
      email: "eva.torres_demo@example.com",
      sponsorId: admin.id,
      referralCodeId: refCodes[0].id, // ALICE-DEMO
      status: InvitationStatus.CLAIMED,
      claimedByUserId: tier2[0].id,
    },
  });

  // Pending invitation sent by Bob
  const inv2 = await prisma.invitation.upsert({
    where: { id: "inv_demo_002" },
    update: {},
    create: {
      id: "inv_demo_002",
      name: "Quinn Reed_demo",
      email: "quinn.reed_demo@example.com",
      sponsorId: tier1[0].id,
      referralCodeId: refCodes[1].id, // BOB-DEMO
      status: InvitationStatus.PENDING,
    },
  });

  // Canceled invitation sent by Carmen
  const inv3 = await prisma.invitation.upsert({
    where: { id: "inv_demo_003" },
    update: {},
    create: {
      id: "inv_demo_003",
      name: "Rachel Fox_demo",
      email: "rachel.fox_demo@example.com",
      sponsorId: tier1[1].id,
      referralCodeId: refCodes[2].id, // CARM-DEMO
      status: InvitationStatus.CANCELED,
    },
  });

  // Claimed invitation — tier3[1] (Liam) invited by Frank
  const inv4 = await prisma.invitation.upsert({
    where: { id: "inv_demo_004" },
    update: {},
    create: {
      id: "inv_demo_004",
      name: "Liam Nguyen_demo",
      email: "liam.nguyen_demo@example.com",
      sponsorId: tier2[1].id,
      referralCodeId: refCodes[5].id, // FRANK-DEMO
      status: InvitationStatus.CLAIMED,
      claimedByUserId: tier3[1].id,
    },
  });

  // Two more pending invitations
  const inv5 = await prisma.invitation.upsert({
    where: { id: "inv_demo_005" },
    update: {},
    create: {
      id: "inv_demo_005",
      name: "Sam Hayes_demo",
      email: "sam.hayes_demo@example.com",
      sponsorId: tier2[2].id,
      referralCodeId: refCodes[6].id, // GRACE-DEMO
      status: InvitationStatus.PENDING,
    },
  });

  const inv6 = await prisma.invitation.upsert({
    where: { id: "inv_demo_006" },
    update: {},
    create: {
      id: "inv_demo_006",
      name: "Tina Brooks_demo",
      email: "tina.brooks_demo@example.com",
      sponsorId: tier1[2].id,
      referralCodeId: refCodes[3].id, // DAVE-DEMO
      status: InvitationStatus.PENDING,
    },
  });

  const invitations = [inv1, inv2, inv3, inv4, inv5, inv6];
  console.log(`  ✓ ${invitations.length} invitations`);

  // ── 4. Credit Nominations + Transactions ──────────────────────────────

  // Approved nomination: admin nominates Bob for 100 credits
  const nom1tx = await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_001" },
    update: {},
    create: {
      id: "ctx_demo_001",
      userId: tier1[0].id,
      amount: 100,
      description: "Approved nomination: Community contribution",
      nominatorId: admin.id,
      approverId: admin.id,
      createdAt: daysAgo(60),
    },
  });

  const nom1 = await prisma.creditNomination.upsert({
    where: { id: "nom_demo_001" },
    update: {},
    create: {
      id: "nom_demo_001",
      userId: tier1[0].id,
      nominatorId: admin.id,
      amount: 100,
      description: "Community contribution",
      status: NominationStatus.APPROVED,
      approverId: admin.id,
      creditTransactionId: nom1tx.id,
      createdAt: daysAgo(62),
    },
  });

  // Approved nomination: Bob nominates Eva for 50 credits
  const nom2tx = await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_002" },
    update: {},
    create: {
      id: "ctx_demo_002",
      userId: tier2[0].id,
      amount: 50,
      description: "Approved nomination: Referral milestone",
      nominatorId: tier1[0].id,
      approverId: admin.id,
      createdAt: daysAgo(45),
    },
  });

  const nom2 = await prisma.creditNomination.upsert({
    where: { id: "nom_demo_002" },
    update: {},
    create: {
      id: "nom_demo_002",
      userId: tier2[0].id,
      nominatorId: tier1[0].id,
      amount: 50,
      description: "Referral milestone",
      status: NominationStatus.APPROVED,
      approverId: admin.id,
      creditTransactionId: nom2tx.id,
      createdAt: daysAgo(47),
    },
  });

  // Pending nomination: Carmen nominates Grace for 75 credits
  const nom3 = await prisma.creditNomination.upsert({
    where: { id: "nom_demo_003" },
    update: {},
    create: {
      id: "nom_demo_003",
      userId: tier2[2].id,
      nominatorId: tier1[1].id,
      amount: 75,
      description: "Outstanding recruit activity",
      status: NominationStatus.PENDING,
      createdAt: daysAgo(10),
    },
  });

  // Rejected nomination: David nominates Jake for 200 credits
  const nom4 = await prisma.creditNomination.upsert({
    where: { id: "nom_demo_004" },
    update: {},
    create: {
      id: "nom_demo_004",
      userId: tier2[5].id,
      nominatorId: tier1[2].id,
      amount: 200,
      description: "Special recognition",
      status: NominationStatus.REJECTED,
      approverId: admin.id,
      rejectionReason: "Amount exceeds monthly cap for new members.",
      createdAt: daysAgo(30),
    },
  });

  // Pending nomination: Eva nominates Karen
  const nom5 = await prisma.creditNomination.upsert({
    where: { id: "nom_demo_005" },
    update: {},
    create: {
      id: "nom_demo_005",
      userId: tier3[0].id,
      nominatorId: tier2[0].id,
      amount: 40,
      description: "Active engagement bonus",
      status: NominationStatus.PENDING,
      createdAt: daysAgo(5),
    },
  });

  const nominations = [nom1, nom2, nom3, nom4, nom5];
  console.log(`  ✓ ${nominations.length} credit nominations`);

  // ── 5. Invitation Credit Grants ───────────────────────────────────────

  // Approved grant for inv1 (Eva's claimed invitation)
  const icgTx1 = await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_003" },
    update: {},
    create: {
      id: "ctx_demo_003",
      userId: admin.id, // sponsor receives the credit
      amount: 25,
      description: "Invitation credit: Eva Torres_demo joined",
      nominatorId: admin.id,
      approverId: admin.id,
      createdAt: daysAgo(55),
    },
  });

  const icg1 = await prisma.invitationCreditGrant.upsert({
    where: { id: "icg_demo_001" },
    update: {},
    create: {
      id: "icg_demo_001",
      invitationId: inv1.id,
      amount: 25,
      description: "Sponsor reward for Eva Torres_demo joining",
      nominatorId: admin.id,
      approverId: admin.id,
      status: InvitationCreditStatus.APPROVED,
      creditTransactionId: icgTx1.id,
    },
  });

  // Pending grant for inv4 (Liam's claimed invitation)
  const icg2 = await prisma.invitationCreditGrant.upsert({
    where: { id: "icg_demo_002" },
    update: {},
    create: {
      id: "icg_demo_002",
      invitationId: inv4.id,
      amount: 25,
      description: "Sponsor reward for Liam Nguyen_demo joining",
      nominatorId: admin.id,
      status: InvitationCreditStatus.PENDING,
    },
  });

  // Rejected grant for inv3 (canceled invitation)
  const icg3 = await prisma.invitationCreditGrant.upsert({
    where: { id: "icg_demo_003" },
    update: {},
    create: {
      id: "icg_demo_003",
      invitationId: inv3.id,
      amount: 25,
      description: "Sponsor reward for Rachel Fox_demo (invitation canceled)",
      nominatorId: admin.id,
      approverId: admin.id,
      status: InvitationCreditStatus.REJECTED,
      rejectionReason: "Invitation was canceled before the recruit joined.",
    },
  });

  const grants = [icg1, icg2, icg3];
  console.log(`  ✓ ${grants.length} invitation credit grants`);

  // ── 6. Impersonation Sessions ─────────────────────────────────────────

  // Ended session: admin impersonated Bob
  const imp1 = await prisma.impersonationSession.upsert({
    where: { id: "imp_demo_001" },
    update: {},
    create: {
      id: "imp_demo_001",
      adminId: admin.id,
      impersonatedUserId: tier1[0].id,
      status: ImpersonationSessionStatus.ENDED,
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (demo)",
      startedAt: daysAgo(20),
      endedAt: daysAgo(20),
    },
  });

  // Active session: admin impersonating Grace
  const imp2 = await prisma.impersonationSession.upsert({
    where: { id: "imp_demo_002" },
    update: {},
    create: {
      id: "imp_demo_002",
      adminId: admin.id,
      impersonatedUserId: tier2[2].id,
      status: ImpersonationSessionStatus.ACTIVE,
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (demo)",
      startedAt: daysAgo(1),
    },
  });

  const sessions = [imp1, imp2];
  console.log(`  ✓ ${sessions.length} impersonation sessions`);

  console.log("\n✅  Seed complete!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
