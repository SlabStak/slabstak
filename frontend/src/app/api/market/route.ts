import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/auth";

const BACKEND_MARKET_URL = process.env.BACKEND_MARKET_URL; // e.g. https://backend/market

if (!BACKEND_MARKET_URL) {
  throw new Error("Missing BACKEND_MARKET_URL env var");
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserServer();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const res = await fetch(BACKEND_MARKET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Backend market error:", res.status, text);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
