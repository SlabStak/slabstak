export interface MarketSnapshot {
  source: string;
  currency: string;
  floor: number;
  average: number;
  ceiling: number;
  listings_count?: number | null;
  last_sale_price?: number | null;
  last_sale_date?: string | null;
}

export async function fetchMarketSnapshot(params: {
  player: string;
  set_name: string;
  year: number | null;
  grade_estimate: string | null;
}): Promise<MarketSnapshot> {
  const res = await fetch("/api/market", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to fetch market data");
  }

  return (await res.json()) as MarketSnapshot;
}
