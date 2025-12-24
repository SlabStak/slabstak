import { notFound } from "next/navigation";
import ShowEditor from "@/components/dealer/ShowEditor";

interface ShowPageProps {
  params: Promise<{ id: string }>;
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
  const { id } = await params;
  const data = await fetchSummary(id);
  if (!data) notFound();

  const { show, cards, stats } = data as any;

  return (
    <div className="space-y-6">
      <ShowEditor show={show} cards={cards} />

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
    </div>
  );
}
