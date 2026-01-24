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

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { card_id } = body;

  if (!card_id) {
    return NextResponse.json({ error: "card_id is required" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Verify ownership
  const { data: card, error: checkError } = await supabase
    .from("dealer_show_cards")
    .select("id")
    .eq("id", card_id)
    .eq("user_id", user.id)
    .single();

  if (checkError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Update only allowed price fields
  const updates: Record<string, any> = {};
  if ("buy_price" in body) updates.buy_price = body.buy_price;
  if ("asking_price" in body) updates.asking_price = body.asking_price;
  if ("sale_price" in body) updates.sale_price = body.sale_price;
  if ("status" in body) updates.status = body.status;
  if ("notes" in body) updates.notes = body.notes;

  const { data: updated, error } = await supabase
    .from("dealer_show_cards")
    .update(updates)
    .eq("id", card_id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }

  return NextResponse.json({ show_card: updated }, { status: 200 });
}
