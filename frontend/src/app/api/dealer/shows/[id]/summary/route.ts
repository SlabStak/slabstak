import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const showId = params.id;
  const supabase = getSupabaseServer();

  const { data: show, error: showError } = await supabase
    .from("dealer_shows")
    .select("*")
    .eq("id", showId)
    .eq("user_id", user.id)
    .single();

  if (showError || !show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  const { data: cards, error: cardsError } = await supabase
    .from("dealer_show_cards")
    .select("*")
    .eq("show_id", showId)
    .eq("user_id", user.id);

  if (cardsError) {
    console.error(cardsError);
    return NextResponse.json({ error: "Failed to load show cards" }, { status: 500 });
  }

  const stats = (() => {
    let totalBuy = 0;
    let totalSales = 0;
    let soldCount = 0;

    (cards ?? []).forEach((c: any) => {
      if (c.buy_price != null) totalBuy += Number(c.buy_price);
      if (c.sale_price != null) {
        totalSales += Number(c.sale_price);
        soldCount += 1;
      }
    });

    const profit = totalSales - totalBuy;
    const roi = totalBuy > 0 ? (profit / totalBuy) * 100 : null;

    return {
      total_buy_in: totalBuy,
      total_sales: totalSales,
      profit,
      roi,
      sold_count: soldCount,
      total_cards: cards?.length ?? 0,
    };
  })();

  return NextResponse.json(
    {
      show,
      cards: cards ?? [],
      stats,
    },
    { status: 200 }
  );
}
