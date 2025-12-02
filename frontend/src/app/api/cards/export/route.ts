import { NextResponse } from "next/server";
import { getCurrentUserServer, getUserCards } from "@/lib/auth";

function toCsvValue(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  if (s.includes(",") || s.includes("\n")) return `"${s}"`;
  return s;
}

export async function GET() {
  const user = await getCurrentUserServer();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cards = await getUserCards(user.id);

  const headers = [
    "id",
    "created_at",
    "player",
    "team",
    "sport",
    "set_name",
    "year",
    "grade_estimate",
    "estimated_low",
    "estimated_high",
    "recommendation",
    "notes",
  ];

  const rows = cards.map((c) => [
    c.id,
    c.created_at,
    c.player,
    c.team,
    c.sport,
    c.set_name,
    c.year,
    c.grade_estimate,
    c.estimated_low,
    c.estimated_high,
    c.recommendation,
    c.notes,
  ]);

  const csv =
    headers.join(",") +
    "\n" +
    rows.map((r) => r.map(toCsvValue).join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="slabstak_vault.csv"',
    },
  });
}
