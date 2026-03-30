import { PrismaPg } from "@prisma/adapter-pg";
import {
  CreditStatus,
  ImpersonationSessionStatus,
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

function signupCode(prefix: string) {
  return `CLAIM-${prefix.toUpperCase()}-DEMO`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
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
      referralCode: referralCode("ALICE"),
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
        refCode: "BOB",
      },
      {
        n: 3,
        name: "Carmen Diaz_demo",
        display: "cdiaz_demo",
        email: "carmen.diaz_demo@example.com",
        location: "Miami, FL",
        refCode: "CARM",
      },
      {
        n: 4,
        name: "David Kim_demo",
        display: "dkim_demo",
        email: "david.kim_demo@example.com",
        location: "Seattle, WA",
        refCode: "DAVE",
      },
    ].map(({ n, name, display, email, location, refCode }) =>
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
          referralCode: referralCode(refCode),
          joinedAt: daysAgo(300 - n * 10),
          createdAt: daysAgo(300 - n * 10),
        },
      })
    )
  );

  // Tier-2 users (each sponsored by a tier-1)
  const tier2Defs = [
    { n: 5,  name: "Eva Torres_demo",   display: "etorres_demo",   email: "eva.torres_demo@example.com",    location: "Denver, CO",     sponsorIdx: 0, refCode: "EVA" },
    { n: 6,  name: "Frank Lee_demo",    display: "flee_demo",      email: "frank.lee_demo@example.com",     location: "Chicago, IL",    sponsorIdx: 0, refCode: "FRANK" },
    { n: 7,  name: "Grace Patel_demo",  display: "gpatel_demo",    email: "grace.patel_demo@example.com",   location: "Boston, MA",     sponsorIdx: 1, refCode: "GRACE" },
    { n: 8,  name: "Henry Brown_demo",  display: "hbrown_demo",    email: "henry.brown_demo@example.com",   location: "Portland, OR",   sponsorIdx: 1, refCode: "HENRY" },
    { n: 9,  name: "Isla Martin_demo",  display: "imartin_demo",   email: "isla.martin_demo@example.com",   location: "Nashville, TN",  sponsorIdx: 2, refCode: "ISLA" },
    { n: 10, name: "Jake Wilson_demo",  display: "jwilson_demo",   email: "jake.wilson_demo@example.com",   location: "Phoenix, AZ",    sponsorIdx: 2, refCode: "JAKE" },
  ];

  const tier2 = await Promise.all(
    tier2Defs.map(({ n, name, display, email, location, sponsorIdx, refCode }) =>
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
          referralCode: referralCode(refCode),
          joinedAt: daysAgo(200 - n * 5),
          createdAt: daysAgo(200 - n * 5),
        },
      })
    )
  );

  // Tier-3 users (deeper tree)
  const tier3Defs = [
    { n: 11, name: "Karen White_demo",   display: "kwhite_demo",   email: "karen.white_demo@example.com",   location: "Atlanta, GA",    sponsorIdx: 0, refCode: "KAREN" },
    { n: 12, name: "Liam Nguyen_demo",   display: "lnguyen_demo",  email: "liam.nguyen_demo@example.com",   location: "Las Vegas, NV",  sponsorIdx: 1, refCode: "LIAM" },
    { n: 13, name: "Mia Clark_demo",     display: "mclark_demo",   email: "mia.clark_demo@example.com",     location: "Houston, TX",    sponsorIdx: 2, refCode: "MIA" },
    { n: 14, name: "Noah Davis_demo",    display: "ndavis_demo",   email: "noah.davis_demo@example.com",    location: "New York, NY",   sponsorIdx: 3, refCode: "NOAH" },
    { n: 15, name: "Olivia Scott_demo",  display: "oscott_demo",   email: "olivia.scott_demo@example.com",  location: "Charlotte, NC",  sponsorIdx: 4, status: UserStatus.INACTIVE, refCode: "OLIVIA" },
    { n: 16, name: "Paul Adams_demo",    display: "padams_demo",   email: "paul.adams_demo@example.com",    location: "Detroit, MI",    sponsorIdx: 5, refCode: "PAUL" },
  ];

  const tier3 = await Promise.all(
    tier3Defs.map(({ n, name, display, email, location, sponsorIdx, status, refCode }) =>
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
          referralCode: referralCode(refCode),
          joinedAt: daysAgo(100 - n),
          createdAt: daysAgo(100 - n),
        },
      })
    )
  );

  const allUsers = [admin, ...tier1, ...tier2, ...tier3];
  console.log(`  ✓ ${allUsers.length} users`);

  // ── 2. Pending Invitations (PENDING_SIGNUP users) ──────────────────────

  const inv1 = await prisma.user.upsert({
    where: { referralCode: referralCode("QUINN") },
    update: {},
    create: {
      name: "Quinn Reed_demo",
      email: "quinn.reed_demo@example.com",
      sponsorId: tier1[0].id,
      status: UserStatus.PENDING_SIGNUP,
      referralCode: referralCode("QUINN"),
      signupCode: signupCode("QUINN"),
      createdAt: daysAgo(15),
    },
  });

  const inv2 = await prisma.user.upsert({
    where: { referralCode: referralCode("SAM") },
    update: {},
    create: {
      name: "Sam Hayes_demo",
      email: "sam.hayes_demo@example.com",
      sponsorId: tier2[2].id,
      status: UserStatus.PENDING_SIGNUP,
      referralCode: referralCode("SAM"),
      signupCode: signupCode("SAM"),
      createdAt: daysAgo(10),
    },
  });

  const inv3 = await prisma.user.upsert({
    where: { referralCode: referralCode("TINA") },
    update: {},
    create: {
      name: "Tina Brooks_demo",
      email: "tina.brooks_demo@example.com",
      sponsorId: tier1[2].id,
      status: UserStatus.PENDING_SIGNUP,
      referralCode: referralCode("TINA"),
      signupCode: signupCode("TINA"),
      createdAt: daysAgo(8),
    },
  });

  const pendingInvitations = [inv1, inv2, inv3];
  console.log(`  ✓ ${pendingInvitations.length} pending invitations (PENDING_SIGNUP users)`);

  // ── 3. Credit Transactions ────────────────────────────────────────────

  // Approved nomination: admin nominates Bob for 100 credits
  await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_001" },
    update: {},
    create: {
      id: "ctx_demo_001",
      userId: tier1[0].id,
      amount: 100,
      description: "Community contribution",
      category: "nomination",
      status: CreditStatus.APPROVED,
      nominatorId: admin.id,
      approverId: admin.id,
      createdAt: daysAgo(60),
    },
  });

  // Approved nomination: Bob nominates Eva for 50 credits
  await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_002" },
    update: {},
    create: {
      id: "ctx_demo_002",
      userId: tier2[0].id,
      amount: 50,
      description: "Referral milestone",
      category: "nomination",
      status: CreditStatus.APPROVED,
      nominatorId: tier1[0].id,
      approverId: admin.id,
      createdAt: daysAgo(45),
    },
  });

  // Approved invitation credit: admin gets 25 credits for Eva joining
  await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_003" },
    update: {},
    create: {
      id: "ctx_demo_003",
      userId: admin.id,
      amount: 25,
      description: "Invitation credit: Eva Torres_demo joined",
      category: "invitation-credit",
      status: CreditStatus.APPROVED,
      nominatorId: admin.id,
      approverId: admin.id,
      createdAt: daysAgo(55),
    },
  });

  // Pending nomination: Carmen nominates Grace for 75 credits
  await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_004" },
    update: {},
    create: {
      id: "ctx_demo_004",
      userId: tier2[2].id,
      amount: 75,
      description: "Outstanding recruit activity",
      category: "nomination",
      status: CreditStatus.PENDING,
      nominatorId: tier1[1].id,
      createdAt: daysAgo(10),
    },
  });

  // Rejected nomination: David nominates Jake for 200 credits
  await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_005" },
    update: {},
    create: {
      id: "ctx_demo_005",
      userId: tier2[5].id,
      amount: 200,
      description: "Special recognition",
      category: "nomination",
      status: CreditStatus.REJECTED,
      nominatorId: tier1[2].id,
      approverId: admin.id,
      rejectionReason: "Amount exceeds monthly cap for new members.",
      createdAt: daysAgo(30),
    },
  });

  // Pending nomination: Eva nominates Karen
  await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_006" },
    update: {},
    create: {
      id: "ctx_demo_006",
      userId: tier3[0].id,
      amount: 40,
      description: "Active engagement bonus",
      category: "nomination",
      status: CreditStatus.PENDING,
      nominatorId: tier2[0].id,
      createdAt: daysAgo(5),
    },
  });

  // Pending invitation credit for Liam joining (nominated by admin)
  await prisma.creditTransaction.upsert({
    where: { id: "ctx_demo_007" },
    update: {},
    create: {
      id: "ctx_demo_007",
      userId: tier2[1].id,
      amount: 25,
      description: "Sponsor reward for Liam Nguyen_demo joining",
      category: "invitation-credit",
      status: CreditStatus.PENDING,
      nominatorId: admin.id,
      createdAt: daysAgo(12),
    },
  });

  console.log("  ✓ 7 credit transactions");

  // ── 4. Impersonation Sessions ─────────────────────────────────────────

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
