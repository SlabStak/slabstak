import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return data?.role === "admin";
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = await isAdmin(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabaseServer();

  // Fetch analytics data
  const { data: cards } = await supabase.from("cards").select("created_at, player");
  const { data: users } = await supabase.from("user_profiles").select("created_at");

  // Generate time-series data (last 30 days)
  const generateTimeSeries = (dataPoints: any[], dateField: string = "created_at", days = 30) => {
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = dataPoints.filter((d) => {
        const itemDate = new Date(d[dateField]);
        return itemDate >= date && itemDate < nextDate;
      }).length;

      result.push({
        day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: count,
      });
    }

    return result;
  };

  // Count by player for top scanned
  const playerCounts: Record<string, number> = {};
  (cards || []).forEach((card: any) => {
    if (card.player) {
      playerCounts[card.player] = (playerCounts[card.player] || 0) + 1;
    }
  });

  const topPlayers = Object.entries(playerCounts)
    .map(([player, count]) => ({ player, scans: count }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 10);

  return NextResponse.json(
    {
      scans_per_day: generateTimeSeries(cards || [], "created_at", 30),
      active_users: generateTimeSeries(users || [], "created_at", 30),
      top_players: topPlayers,
      summary: {
        total_scans: cards?.length || 0,
        total_users: users?.length || 0,
      },
    },
    { status: 200 }
  );
}
