import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const sport = searchParams.get("sport") || null;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;
    const manufacturer = searchParams.get("manufacturer") || null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    const supabase = getSupabaseServer();

    let query = supabase.from("card_catalog").select("*, count:id.count()", { count: "estimated", head: false });

    // Full-text search if query provided
    if (q.trim()) {
      // Use OR conditions for flexible searching
      query = query.or(
        `player_name.ilike.%${q}%,set_name.ilike.%${q}%,team.ilike.%${q}%,manufacturer.ilike.%${q}%`
      );
    }

    // Add filters
    if (sport) {
      query = query.eq("sport", sport);
    }
    if (year) {
      query = query.eq("year", year);
    }
    if (manufacturer) {
      query = query.eq("manufacturer", manufacturer);
    }

    // Sort by player name, then set name, then card number
    query = query.order("player_name", { ascending: true }).order("set_name", { ascending: true }).order("card_number", { ascending: true });

    // Apply pagination
    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        cards: data || [],
        total: count || 0,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
      },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
