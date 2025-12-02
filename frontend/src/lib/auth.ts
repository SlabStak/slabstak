import { getSupabaseServer } from "./supabaseClient";
import { SubscriptionRecord, CardRecord } from "./types";

export async function getCurrentUserServer() {
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email };
}

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  return (data as SubscriptionRecord) ?? null;
}

export async function getUserCards(userId: string): Promise<CardRecord[]> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as CardRecord[]) ?? [];
}
