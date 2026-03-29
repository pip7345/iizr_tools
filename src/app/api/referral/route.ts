import { type NextRequest, NextResponse } from "next/server";

const REFERRAL_COOKIE = "iizr_referral_code";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const referral = searchParams.get("referral");

  const signUpUrl = new URL("/sign-up", request.nextUrl.origin);
  const response = NextResponse.redirect(signUpUrl);

  if (referral) {
    response.cookies.set(REFERRAL_COOKIE, referral, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
  }

  return response;
}
