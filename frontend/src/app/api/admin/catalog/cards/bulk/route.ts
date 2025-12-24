import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

interface CardPayload {
  player_name: string;
  set_name: string;
  card_number: string;
  year?: number;
  sport?: string;
  manufacturer?: string;
  team?: string;
  position?: string;
  card_type?: string;
  print_run?: number;
  is_parallel?: boolean;
  parallel_type?: string;
  description?: string;
  image_url?: string;
  unique_key: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const cards: CardPayload[] = body.cards;

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { detail: "No cards provided" },
        { status: 400 }
      );
    }

    // Prepare card records
    const cardsToInsert = cards.map((card) => ({
      player_name: card.player_name,
      set_name: card.set_name,
      card_number: card.card_number,
      year: card.year || null,
      sport: card.sport || "basketball",
      manufacturer: card.manufacturer || null,
      team: card.team || null,
      position: card.position || null,
      card_type: card.card_type || "base",
      print_run: card.print_run || null,
      is_parallel: card.is_parallel || false,
      parallel_type: card.parallel_type || null,
      description: card.description || null,
      image_url: card.image_url || null,
      unique_key: card.unique_key,
    }));

    // Batch insert with upsert to handle duplicates gracefully
    const { data, error } = await supabase
      .from("card_catalog")
      .upsert(cardsToInsert, { onConflict: "unique_key" })
      .select();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { detail: error.message, error_code: error.code },
        { status: 400 }
      );
    }

    const insertedCount = data?.length || 0;

    return NextResponse.json(
      {
        message: `Successfully imported ${insertedCount} cards`,
        imported: insertedCount,
        total_requested: cards.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing cards:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
