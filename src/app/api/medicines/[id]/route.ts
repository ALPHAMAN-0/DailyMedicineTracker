import { NextRequest, NextResponse } from "next/server";
import { removeMedicine } from "@/lib/sheets";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await removeMedicine(id);
  return NextResponse.json({ ok: true });
}
