import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, computeSessionToken, timingSafeEqual } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const appPasscode = process.env.APP_PASSCODE;
  if (!appPasscode) {
    return NextResponse.json(
      { error: "APP_PASSCODE is not configured" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!passcode || !timingSafeEqual(passcode, appPasscode)) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = await computeSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
