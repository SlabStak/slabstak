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

    const payload: CardPayload = await req.json();

    // Validate required fields
    if (!payload.player_name || !payload.set_name || !payload.card_number || !payload.unique_key) {
      return NextResponse.json(
        { detail: "Missing required fields: player_name, set_name, card_number, unique_key" },
        { status: 400 }
      );
    }

    // Insert into card_catalog
    const { data, error } = await supabase
      .from("card_catalog")
      .insert([
        {
          player_name: payload.player_name,
          set_name: payload.set_name,
          card_number: payload.card_number,
          year: payload.year || null,
          sport: payload.sport || "basketball",
          manufacturer: payload.manufacturer || null,
          team: payload.team || null,
          position: payload.position || null,
          card_type: payload.card_type || "base",
          print_run: payload.print_run || null,
          is_parallel: payload.is_parallel || false,
          parallel_type: payload.parallel_type || null,
          description: payload.description || null,
          image_url: payload.image_url || null,
          unique_key: payload.unique_key,
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error);
      // Check if it's a unique constraint violation
      if (error.message?.includes("unique_key")) {
        return NextResponse.json(
          { detail: "Card with this unique_key already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Card added successfully", card: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding card:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
