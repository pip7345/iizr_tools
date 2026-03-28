import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/user";
import { getRecruitsTree } from "@/lib/db/users";
import { getCreditBalances } from "@/lib/db/credits";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  await requireUser();
  const { userId } = await params;
  const recruits = await getRecruitsTree(userId);
  const balances = await getCreditBalances(recruits.map((r) => r.id));
  return NextResponse.json(
    recruits.map((r) => ({ ...r, creditBalance: balances[r.id] ?? 0 })),
  );
}
