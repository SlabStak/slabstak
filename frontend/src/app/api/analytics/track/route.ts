import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json({ error: "Event name required" }, { status: 400 });
    }

    // Get current user (if logged in)
    const user = await getCurrentUserServer();

    // Store in database
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("analytics_events").insert({
      user_id: user?.id || null,
      event_name: event,
      properties: properties || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Analytics error:", error);
      // Don't fail the request if analytics fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ success: true }); // Always return success to avoid blocking user actions
  }
}
