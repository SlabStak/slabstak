import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ access: "granted" });
  } catch (error) {
    console.error("Access check error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
