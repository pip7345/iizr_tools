/**
 * add-credits.ts
 *
 * Quick one-shot script to populate credit transactions for all users.
 *
 * Rules:
 *   • Every user gets 1 attendance credit ("Attendance")
 *   • Every user with at least one recruit gets 2 credits per direct recruit
 *     ("Recruiting – <recruit name>")
 *
 * Run with:
 *   npx tsx prisma/add-credits.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const adapter = new PrismaPg({
  connectionString:
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/iizr_tools",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    include: { recruits: true },
  });

  if (users.length === 0) {
    console.log("No users found. Run the seed first.");
    return;
  }

  // Find one admin to act as approver/nominator for these system-generated credits.
  // Falls back to the first user if no admin exists.
  const admin =
    users.find((u) => u.role === "ADMIN") ?? users[0];

  let totalCreated = 0;

  for (const user of users) {
    const entries: { userId: string; amount: number; description: string; nominatorId: string; approverId: string }[] = [];

    // 1 credit for attendance
    entries.push({
      userId: user.id,
      amount: 1,
      description: "Attendance",
      nominatorId: admin.id,
      approverId: admin.id,
    });

    // 2 credits per direct recruit
    for (const recruit of user.recruits) {
      entries.push({
        userId: user.id,
        amount: 2,
        description: `Recruiting – ${recruit.preferredDisplayName ?? recruit.name ?? recruit.email}`,
        nominatorId: admin.id,
        approverId: admin.id,
      });
    }

    await prisma.creditTransaction.createMany({ data: entries });
    totalCreated += entries.length;

    const label = user.preferredDisplayName ?? user.name ?? user.email;
    console.log(
      `  ✓ ${label.padEnd(28)}  attendance: 1  recruiting: ${user.recruits.length * 2}  (${entries.length} rows)`
    );
  }

  console.log(`\nDone. Created ${totalCreated} credit transaction(s) across ${users.length} user(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
