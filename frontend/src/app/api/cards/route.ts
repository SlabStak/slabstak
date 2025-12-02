import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer, getUserSubscription } from "@/lib/auth";
import { FREE_VAULT_LIMIT } from "@/lib/config";

export async function GET() {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }

  return NextResponse.json({ cards: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = getSupabaseServer();

  // Check plan
  const sub = await getUserSubscription(user.id);
  const isPro = sub?.plan === "pro" && sub.status === "active";

  // Count current cards
  const { count, error: countError } = await supabase
    .from("cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    console.error(countError);
  }

  const currentCount = count ?? 0;

  if (!isPro && currentCount >= FREE_VAULT_LIMIT) {
    return NextResponse.json(
      {
        error: "Free vault limit reached.",
        code: "FREE_VAULT_LIMIT",
        message:
          "You’ve filled your free vault. Upgrade to Pro to save more cards.",
      },
      { status: 402 }
    );
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("cards")
    .insert({
      user_id: user.id,
      image_url: body.image_url ?? null,
      player: body.player,
      team: body.team ?? null,
      sport: body.sport ?? null,
      set_name: body.set_name,
      year: body.year,
      grade_estimate: body.grade_estimate,
      estimated_low: body.estimated_low,
      estimated_high: body.estimated_high,
      recommendation: body.recommendation,
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save card" }, { status: 500 });
  }

  return NextResponse.json({ card: data }, { status: 201 });
}
