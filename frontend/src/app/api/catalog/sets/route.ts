import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sport = searchParams.get("sport") || null;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;
    const manufacturer = searchParams.get("manufacturer") || null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    const supabase = getSupabaseServer();

    // Get unique card sets
    let query = supabase
      .from("card_catalog")
      .select("set_name, year, sport, manufacturer, card_type", { count: "estimated" });

    if (sport) {
      query = query.eq("sport", sport);
    }
    if (year) {
      query = query.eq("year", year);
    }
    if (manufacturer) {
      query = query.eq("manufacturer", manufacturer);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Sets error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    // Create set summaries with card count
    const setMap = new Map<string, any>();

    if (data) {
      for (const card of data) {
        const setKey = `${card.set_name}-${card.year}`;
        if (!setMap.has(setKey)) {
          setMap.set(setKey, {
            set_name: card.set_name,
            year: card.year,
            sport: card.sport,
            manufacturer: card.manufacturer,
            card_count: 0,
          });
        }

        const set = setMap.get(setKey);
        set.card_count += 1;
      }
    }

    const sets = Array.from(setMap.values());

    return NextResponse.json(
      {
        sets,
        total: count || 0,
        limit,
        offset,
      },
      { headers: { "Cache-Control": "public, max-age=600" } }
    );
  } catch (error) {
    console.error("Sets error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
