import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_SCAN_URL?.replace("/scan", "") || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model_type, min_confidence } = body;

    const response = await fetch(`${BACKEND_URL}/ml/training-data/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_type, min_confidence })
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || "Export failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Training data export error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
