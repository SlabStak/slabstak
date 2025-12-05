import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_SCAN_URL?.replace("/scan", "") || "http://localhost:8000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const modelId = searchParams.get("model_id");

    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (modelId) params.append("model_id", modelId);

    const response = await fetch(`${BACKEND_URL}/ml/metrics?${params}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch metrics from backend" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
