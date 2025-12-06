import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer, getUserSubscription } from "@/lib/auth";
import { FREE_SCANS_PER_MONTH, PRO_SCANS_PER_MONTH_SOFT } from "@/lib/config";

const BACKEND_SCAN_URL = process.env.NEXT_PUBLIC_BACKEND_SCAN_URL || process.env.BACKEND_SCAN_URL || "http://localhost:8000/scan";

function getYearMonth(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserServer();
  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to scan cards." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseServer();
  const sub = await getUserSubscription(user.id);
  const isPro = sub?.plan === "pro" && sub.status === "active";

  const yearMonth = getYearMonth();

  const { data: usageRow } = await supabase
    .from("scan_usage")
    .select("*")
    .eq("user_id", user.id)
    .eq("year_month", yearMonth)
    .single();

  const currentScans = usageRow?.scans ?? 0;

  if (!isPro && currentScans >= FREE_SCANS_PER_MONTH) {
    return NextResponse.json(
      {
        error: "Free plan limit reached.",
        code: "FREE_LIMIT_REACHED",
        message:
          "You’ve hit your free scans for this month. Upgrade to Pro to keep scanning.",
      },
      { status: 402 }
    );
  }

  if (isPro && currentScans >= PRO_SCANS_PER_MONTH_SOFT) {
    return NextResponse.json(
      {
        error: "Fair use limit reached.",
        code: "PRO_FAIR_USE",
        message:
          "You’ve hit the fair use scan limit. Reach out if you need higher limits.",
      },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file upload." },
      { status: 400 }
    );
  }

  const forwardForm = new FormData();
  forwardForm.append("file", file);

  const backendRes = await fetch(BACKEND_SCAN_URL, {
    method: "POST",
    body: forwardForm,
  });

  if (!backendRes.ok) {
    const text = await backendRes.text().catch(() => "");
    console.error("Backend scan error:", backendRes.status, text);
    return NextResponse.json(
      { error: "Scan failed on backend." },
      { status: 500 }
    );
  }

  const data = await backendRes.json();

  const { error: upsertError } = await supabase
    .from("scan_usage")
    .upsert(
      {
        user_id: user.id,
        year_month: yearMonth,
        scans: currentScans + 1,
      },
      { onConflict: "user_id,year_month" }
    );

  if (upsertError) {
    console.error("Failed to update scan_usage:", upsertError);
  }

  return NextResponse.json(data, { status: 200 });
}
