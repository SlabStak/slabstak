import Link from "next/link";
import Image from "next/image";
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
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/vault/${card.id}`}
          className="group rounded-xl border border-slate-800 bg-slate-900/70 hover:border-sky-500 transition-all overflow-hidden"
        >
          {/* Card Image */}
          {card.image_url ? (
            <div className="relative aspect-[3/4] bg-slate-800">
              <Image
                src={card.image_url}
                alt={`${card.player} - ${card.set_name}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] bg-slate-800/60 flex items-center justify-center border-b border-slate-800">
              <p className="text-slate-600 text-xs">No image</p>
            </div>
          )}

          {/* Card Info */}
          <div className="p-3 space-y-2 text-xs">
            <p className="text-[11px] text-slate-500">
              {new Date(card.created_at).toLocaleDateString()}
            </p>
            <p className="font-semibold text-sm group-hover:text-sky-400 transition-colors">
              {card.player}
            </p>
            <p className="text-slate-300">
              {card.year ? `${card.year} ` : ""}{card.set_name}
            </p>
            {card.grade_estimate && (
              <p className="text-slate-400 text-[11px]">Est. grade: {card.grade_estimate}</p>
            )}
            <p className="text-[11px] text-emerald-400">
              ${card.estimated_low.toFixed(0)} – ${card.estimated_high.toFixed(0)}
            </p>
            <p className={`text-[11px] px-2 py-1 rounded text-center font-medium ${
              card.recommendation === "flip" ? "bg-emerald-500/20 text-emerald-400" :
              card.recommendation === "hold" ? "bg-sky-500/20 text-sky-400" :
              card.recommendation === "grade" ? "bg-purple-500/20 text-purple-400" :
              "bg-slate-700 text-slate-300"
            }`}>
              {card.recommendation.toUpperCase()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
