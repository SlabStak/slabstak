import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("dealer_shows")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load shows" }, { status: 500 });
  }

  return NextResponse.json({ shows: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("dealer_shows")
    .insert({
      user_id: user.id,
      name: body.name,
      location: body.location ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create show" }, { status: 500 });
  }

  return NextResponse.json({ show: data }, { status: 201 });
}
