import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseClient";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

export default async function AnalyticsPage() {
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

  // Fetch analytics data
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(`${base}/api/admin/analytics/summary`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load analytics data</p>
      </div>
    );
  }

  const data = await res.json();

  return <AnalyticsDashboard data={data} />;
}
