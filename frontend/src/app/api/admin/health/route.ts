import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseClient";

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return data?.role === "admin";
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = await isAdmin(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const services = {
    backend: false,
    database: false,
    storage: false,
    stripe: false,
  };

  // Check backend
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_SCAN_URL?.replace("/scan", "/health");
    if (backendUrl) {
      const res = await fetch(backendUrl, { cache: "no-store" });
      services.backend = res.ok;
    }
  } catch (error) {
    console.error("Backend health check failed:", error);
  }

  // Check database
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("user_profiles").select("user_id").limit(1);
    services.database = !error;
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  // Check storage
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.storage.listBuckets();
    services.storage = !error && data !== null;
  } catch (error) {
    console.error("Storage health check failed:", error);
  }

  // Check Stripe
  try {
    const stripe = process.env.STRIPE_SECRET_KEY;
    services.stripe = !!stripe;
  } catch (error) {
    console.error("Stripe health check failed:", error);
  }

  const allHealthy = Object.values(services).every((s) => s);

  return NextResponse.json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services,
  });
}
