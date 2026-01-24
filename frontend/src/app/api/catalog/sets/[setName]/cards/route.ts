import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: { setName: string } }
) {
  try {
    const decodedSetName = decodeURIComponent(params.setName);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    const { data, error, count } = await supabase
      .from("card_catalog")
      .select("*", { count: "estimated" })
      .eq("set_name", decodedSetName)
      .order("card_number", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Set cards error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        set_name: decodedSetName,
        cards: data || [],
        total: count || 0,
        limit,
        offset,
      },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (error) {
    console.error("Set cards error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
