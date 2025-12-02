import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseClient";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect("/");

  // Check if user is admin
  const supabase = getSupabaseServer();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Fetch admin stats
  const [usersResult, cardsResult, subsResult] = await Promise.all([
    supabase.from("user_profiles").select("*", { count: "exact", head: true }),
    supabase.from("cards").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*"),
  ]);

  const stats = {
    totalUsers: usersResult.count || 0,
    totalCards: cardsResult.count || 0,
    activeSubscriptions: subsResult.data?.filter((s) => s.status === "active").length || 0,
    totalRevenue: subsResult.data
      ?.filter((s) => s.plan === "pro")
      .reduce((sum, s) => sum + 29.99, 0) || 0,
  };

  // Fetch recent users
  const { data: recentUsers } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch recent cards
  const { data: recentCards } = await supabase
    .from("cards")
    .select("*, user_profiles!cards_user_id_fkey(email)")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <AdminDashboard
      stats={stats}
      recentUsers={recentUsers || []}
      recentCards={recentCards || []}
    />
  );
}
