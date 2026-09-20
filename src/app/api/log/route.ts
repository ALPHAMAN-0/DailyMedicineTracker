import { NextRequest, NextResponse } from "next/server";
import { saveTodayLog } from "@/lib/sheets";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const checks = body?.checks;
  if (!checks || typeof checks !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  await saveTodayLog(checks as Record<string, boolean[]>);
  return NextResponse.json({ ok: true });
}
