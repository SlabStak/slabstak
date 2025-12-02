import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("dealer_show_cards")
    .insert({
      user_id: user.id,
      show_id: body.show_id,
      card_id: body.card_id ?? null,
      acquisition_type: body.acquisition_type ?? "inventory",
      buy_price: body.buy_price ?? null,
      asking_price: body.asking_price ?? null,
      sale_price: body.sale_price ?? null,
      sale_date: body.sale_date ?? null,
      status: body.status ?? "holding",
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add card to show" }, { status: 500 });
  }

  return NextResponse.json({ show_card: data }, { status: 201 });
}
