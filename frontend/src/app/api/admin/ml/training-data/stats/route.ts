import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_SCAN_URL?.replace("/scan", "") || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/ml/training-data/stats`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch stats from backend" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Training data stats error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
