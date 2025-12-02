import { NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserServer();
  return NextResponse.json({ user }, { status: 200 });
}
