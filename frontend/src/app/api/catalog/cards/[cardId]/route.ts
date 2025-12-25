import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("card_catalog")
      .select("*")
      .eq("id", params.cardId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ detail: "Card not found" }, { status: 404 });
      }
      console.error("Card error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    // Get price history if available
    const { data: priceHistory } = await supabase
      .from("card_values_history")
      .select("*")
      .eq("card_id", params.cardId)
      .order("recorded_at", { ascending: false })
      .limit(10);

    return NextResponse.json(
      {
        card: data,
        price_history: priceHistory || [],
      },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (error) {
    console.error("Card error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
