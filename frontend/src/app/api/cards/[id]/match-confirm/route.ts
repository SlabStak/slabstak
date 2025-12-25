import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // Get user card to verify ownership
    const { data: userCard, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (cardError || !userCard) {
      return NextResponse.json({ detail: "Card not found" }, { status: 404 });
    }

    const body = await req.json();
    const { catalog_card_id, confidence } = body;

    if (!catalog_card_id) {
      return NextResponse.json(
        { detail: "catalog_card_id is required" },
        { status: 400 }
      );
    }

    // Verify catalog card exists
    const { data: catalogCard, error: catalogError } = await supabase
      .from("card_catalog")
      .select("id")
      .eq("id", catalog_card_id)
      .single();

    if (catalogError || !catalogCard) {
      return NextResponse.json(
        { detail: "Catalog card not found" },
        { status: 404 }
      );
    }

    // Create or update user_card_matches entry
    const { data: match, error: matchError } = await supabase
      .from("user_card_matches")
      .upsert(
        {
          user_card_id: params.id,
          catalog_card_id: catalog_card_id,
          match_confidence: confidence || 0.95,
          matched_by: "user",
          matched_at: new Date().toISOString(),
        },
        { onConflict: "user_card_id" }
      )
      .select();

    if (matchError) {
      console.error("Match error:", matchError);
      return NextResponse.json(
        { detail: "Failed to save match" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Card matched successfully",
        match: match[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Match confirm error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
