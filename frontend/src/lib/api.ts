import { ScanResult } from "./types";

export async function saveCardToVault(result: ScanResult) {
  const res = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: null,
      player: result.player,
      team: null,
      sport: null,
      set_name: result.set_name,
      year: result.year,
      grade_estimate: result.grade_estimate,
      estimated_low: result.estimated_low,
      estimated_high: result.estimated_high,
      recommendation: result.recommendation,
      notes: null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to save card");
  }
}
