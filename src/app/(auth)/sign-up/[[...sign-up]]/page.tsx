import { cookies } from "next/headers";
import { SignUp } from "@clerk/nextjs";

const REFERRAL_COOKIE = "iizr_referral_code";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const referral = params.referral;

  // Store referral code in a cookie so we can use it after Clerk signup completes
  if (referral) {
    const cookieStore = await cookies();
    cookieStore.set(REFERRAL_COOKIE, referral, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <SignUp forceRedirectUrl="/dashboard" />
    </main>
  );
}
