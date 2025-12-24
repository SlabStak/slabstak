import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: { playerName: string } }
) {
  try {
    const decodedPlayerName = decodeURIComponent(params.playerName);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    const { data, error, count } = await supabase
      .from("card_catalog")
      .select("*", { count: "estimated" })
      .ilike("player_name", decodedPlayerName)
      .order("year", { ascending: false })
      .order("set_name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Player cards error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        player_name: decodedPlayerName,
        cards: data || [],
        total: count || 0,
        limit,
        offset,
      },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (error) {
    console.error("Player cards error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
