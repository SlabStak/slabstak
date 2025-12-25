import { NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const user = await getCurrentUserServer();

    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const supabase = getSupabaseServer();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_profiles: profile,
      },
    });
  } catch (error) {
    console.error("Auth user error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
