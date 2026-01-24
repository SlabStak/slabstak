import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer();

    // Get seller profile
    const { data: sellerProfile, error } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("user_id", params.id)
      .single();

    if (error || !sellerProfile) {
      // Return default profile if not found
      return NextResponse.json({
        profile: {
          user_id: params.id,
          average_rating: 0,
          total_sales: 0,
        },
      });
    }

    return NextResponse.json({
      profile: sellerProfile,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("Seller profile error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
