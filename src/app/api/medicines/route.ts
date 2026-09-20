import { NextRequest, NextResponse } from "next/server";
import { getMedicines, addMedicine } from "@/lib/sheets";

export async function GET() {
  const medicines = await getMedicines(true);
  return NextResponse.json({ medicines });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const doseCount = Number(body?.doseCount);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!Number.isInteger(doseCount) || doseCount < 1 || doseCount > 4) {
    return NextResponse.json(
      { error: "Doses per day must be between 1 and 4" },
      { status: 400 }
    );
  }

  await addMedicine(name, doseCount);
  return NextResponse.json({ ok: true }, { status: 201 });
}
