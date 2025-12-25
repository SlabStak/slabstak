import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

/**
 * Card Matching Algorithm
 * Calculates confidence score 0.0 - 1.0 for how well a user card matches a catalog card
 */
function calculateMatchScore(userCard: any, catalogCard: any): number {
  let score = 0.0;

  // Player name match (40%) - highest weight
  if (userCard.player && catalogCard.player_name) {
    const userPlayer = userCard.player.toLowerCase().trim();
    const catalogPlayer = catalogCard.player_name.toLowerCase().trim();

    if (userPlayer === catalogPlayer) {
      score += 0.40;
    } else if (userPlayer.includes(catalogPlayer.split(" ")[0]) || catalogPlayer.includes(userPlayer.split(" ")[0])) {
      // Partial match (first name or last name)
      score += 0.30;
    }
  }

  // Set name match (35%)
  if (userCard.set_name && catalogCard.set_name) {
    const userSet = userCard.set_name.toLowerCase().trim();
    const catalogSet = catalogCard.set_name.toLowerCase().trim();

    if (userSet === catalogSet) {
      score += 0.35;
    } else if (userSet.includes(catalogSet) || catalogSet.includes(userSet)) {
      // Partial match
      score += 0.20;
    }
  }

  // Year match (15%)
  if (userCard.year && catalogCard.year && userCard.year === catalogCard.year) {
    score += 0.15;
  }

  // Ensure score is between 0 and 1
  return Math.min(1.0, Math.max(0.0, score));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // Get user card
    const { data: userCard, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (cardError || !userCard) {
      return NextResponse.json({ detail: "Card not found" }, { status: 404 });
    }

    // Search catalog for potential matches
    const searchFilters = [];

    if (userCard.player) {
      searchFilters.push(`player_name.ilike.%${userCard.player}%`);
    }
    if (userCard.set_name) {
      searchFilters.push(`set_name.ilike.%${userCard.set_name}%`);
    }

    let query = supabase.from("card_catalog").select("*");

    // Apply search filters
    if (searchFilters.length > 0) {
      query = query.or(searchFilters.join(","));
    }

    const { data: catalogCards, error: searchError } = await query.limit(50);

    if (searchError) {
      console.error("Search error:", searchError);
      return NextResponse.json(
        { detail: "Failed to search catalog" },
        { status: 500 }
      );
    }

    // Calculate match scores and sort by confidence
    const matches = catalogCards
      .map((catalogCard: any) => ({
        catalog_card_id: catalogCard.id,
        player_name: catalogCard.player_name,
        set_name: catalogCard.set_name,
        card_number: catalogCard.card_number,
        year: catalogCard.year,
        sport: catalogCard.sport,
        manufacturer: catalogCard.manufacturer,
        team: catalogCard.team,
        image_url: catalogCard.image_url,
        confidence: calculateMatchScore(userCard, catalogCard),
      }))
      .sort((a: any, b: any) => b.confidence - a.confidence)
      .slice(0, 10);

    // Filter out matches with low confidence (less than 0.10)
    const significantMatches = matches.filter((m: any) => m.confidence >= 0.10);

    return NextResponse.json(
      {
        user_card_id: userCard.id,
        user_card: userCard,
        matches: significantMatches,
        best_match: significantMatches[0] || null,
        match_count: significantMatches.length,
      },
      { headers: { "Cache-Control": "no-cache" } }
    );
  } catch (error) {
    console.error("Matching error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
