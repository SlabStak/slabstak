import { notFound } from "next/navigation";

interface ShowPageProps {
  params: { id: string };
}

async function fetchSummary(id: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(`${base}/api/dealer/shows/${id}/summary`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ShowPage({ params }: ShowPageProps) {
  const data = await fetchSummary(params.id);
  if (!data) notFound();

  const { show, cards, stats } = data as any;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold">{show.name}</h1>
        <p className="text-sm text-slate-300">
          {show.location || "Location TBA"}
        </p>
        <p className="text-xs text-slate-500">
          Total cards: {stats.total_cards} · Sold: {stats.sold_count}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.16em]">
            Buy-in
          </p>
          <p className="text-lg font-semibold text-slate-100">
            ${stats.total_buy_in.toFixed(0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.16em]">
            Sales
          </p>
          <p className="text-lg font-semibold text-emerald-400">
            ${stats.total_sales.toFixed(0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.16em]">
            Profit
          </p>
          <p
            className={`text-lg font-semibold ${
              stats.profit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            ${stats.profit.toFixed(0)}
          </p>
          {stats.roi !== null && (
            <p className="text-[11px] text-slate-400">
              ROI: {stats.roi.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-400 uppercase tracking-[0.16em]">
          Cards in this show
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-2 py-2 text-left">Card</th>
                <th className="px-2 py-2 text-right">Buy</th>
                <th className="px-2 py-2 text-right">Ask</th>
                <th className="px-2 py-2 text-right">Sale</th>
                <th className="px-2 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {cards.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-2 py-2">
                    <span className="text-slate-100">{c.notes || "Card"}</span>
                  </td>
                  <td className="px-2 py-2 text-right text-slate-300">
                    {c.buy_price != null
                      ? `$${Number(c.buy_price).toFixed(0)}`
                      : "-"}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-300">
                    {c.asking_price != null
                      ? `$${Number(c.asking_price).toFixed(0)}`
                      : "-"}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-300">
                    {c.sale_price != null
                      ? `$${Number(c.sale_price).toFixed(0)}`
                      : "-"}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-400">
                    {c.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
