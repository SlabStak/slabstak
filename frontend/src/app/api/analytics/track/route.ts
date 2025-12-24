import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

/**
 * Analytics tracking endpoint with rate limiting
 * Tracks user actions and scans for analytics with a limit of 5 requests per minute per user
 */

// Simple in-memory rate limiter for analytics endpoint
const analyticsRateLimits: Map<string, number[]> = new Map();
const ANALYTICS_RATE_LIMIT = 5; // 5 requests per minute
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;

  if (!analyticsRateLimits.has(clientId)) {
    analyticsRateLimits.set(clientId, [now]);
    return false;
  }

  const timestamps = analyticsRateLimits.get(clientId)!;
  const recentRequests = timestamps.filter((ts) => ts > windowStart);

  if (recentRequests.length >= ANALYTICS_RATE_LIMIT) {
    return true;
  }

  recentRequests.push(now);
  analyticsRateLimits.set(clientId, recentRequests);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json({ error: "Event name required" }, { status: 400 });
    }

    // Get current user (if logged in)
    const user = await getCurrentUserServer();
    const clientId = user?.id || req.headers.get("x-forwarded-for") || "anonymous";

    // Check rate limit
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { success: true }, // Still return success to not block UI
        { status: 200, headers: { "X-RateLimit-Remaining": "0" } }
      );
    }

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
