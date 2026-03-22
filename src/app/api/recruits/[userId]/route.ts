import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/user";
import { getRecruitsTree } from "@/lib/db/users";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  await requireUser();
  const { userId } = await params;
  const recruits = await getRecruitsTree(userId);
  return NextResponse.json(recruits);
}
