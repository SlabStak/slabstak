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

  // Fetch all users with their profiles
  const { data: users } = await supabase
    .from("user_profiles")
    .select("id, role, display_name, created_at");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id, plan, status");

  // Create subscription map for quick lookup
  const subMap = new Map(subscriptions?.map((s) => [s.user_id, s]) || []);

  // Build CSV
  const headers = ["User ID", "Display Name", "Role", "Subscription Plan", "Status", "Joined"];
  const rows = (users || []).map((u: any) => {
    const sub = subMap.get(u.id);
    return [
      u.id,
      u.display_name || "N/A",
      u.role,
      sub?.plan || "free",
      sub?.status || "inactive",
      new Date(u.created_at).toLocaleDateString(),
    ];
  });

  // Format CSV
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="users_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
