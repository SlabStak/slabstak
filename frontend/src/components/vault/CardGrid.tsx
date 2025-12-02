import { CardRecord } from "@/lib/types";

export default function CardGrid({ cards }: { cards: CardRecord[] }) {
  if (!cards.length) {
    return (
      <p className="text-sm text-slate-400">
        No cards saved yet. Scan a card and hit &quot;Save to vault&quot; to start building your stack.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2 text-xs"
        >
          <p className="text-[11px] text-slate-500">
            {new Date(card.created_at).toLocaleDateString()}
          </p>
          <p className="font-semibold text-sm">{card.player}</p>
          <p className="text-slate-300">
            {card.year ? `${card.year} ` : ""}{card.set_name}
          </p>
          {card.grade_estimate && (
            <p className="text-slate-400 text-[11px]">Est. grade: {card.grade_estimate}</p>
          )}
          <p className="text-[11px] text-emerald-400">
            ${card.estimated_low.toFixed(0)} – ${card.estimated_high.toFixed(0)}
          </p>
          <p className="text-[11px] text-slate-500">
            Call: <span className="uppercase">{card.recommendation}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
