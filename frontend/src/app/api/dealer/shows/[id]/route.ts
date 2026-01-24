import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const supabase = getSupabaseServer();

  // Verify ownership
  const { data: show, error: checkError } = await supabase
    .from("dealer_shows")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (checkError || !show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  // Update only allowed fields
  const updates: Record<string, any> = {};
  if ("name" in body) updates.name = body.name;
  if ("location" in body) updates.location = body.location ?? null;
  if ("start_date" in body) updates.start_date = body.start_date ?? null;
  if ("end_date" in body) updates.end_date = body.end_date ?? null;
  if ("notes" in body) updates.notes = body.notes ?? null;

  const { data: updated, error } = await supabase
    .from("dealer_shows")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update show" }, { status: 500 });
  }

  return NextResponse.json({ show: updated }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = getSupabaseServer();

  // Verify ownership
  const { data: show, error: checkError } = await supabase
    .from("dealer_shows")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (checkError || !show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  // Delete all associated cards first
  const { error: cardsError } = await supabase
    .from("dealer_show_cards")
    .delete()
    .eq("show_id", id)
    .eq("user_id", user.id);

  if (cardsError) {
    console.error(cardsError);
    return NextResponse.json({ error: "Failed to delete show cards" }, { status: 500 });
  }

  // Delete the show
  const { error } = await supabase
    .from("dealer_shows")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete show" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
