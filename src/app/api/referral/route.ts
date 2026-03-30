import { type NextRequest, NextResponse } from "next/server";

const REFERRAL_COOKIE = "iizr_referral_code";
const SIGNUP_COOKIE = "iizr_signup_code";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const referral = searchParams.get("referral");
  const claim = searchParams.get("claim");

  const signUpUrl = new URL("/sign-up", request.nextUrl.origin);
  const response = NextResponse.redirect(signUpUrl);

  if (claim) {
    response.cookies.set(SIGNUP_COOKIE, claim, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
  } else if (referral) {
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
