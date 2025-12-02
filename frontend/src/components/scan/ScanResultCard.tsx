import { ScanResult } from "@/lib/types";

export default function ScanResultCard({ result }: { result: ScanResult }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">AI read</p>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] text-emerald-400 border border-emerald-500/40">
          {result.recommendation.toUpperCase()}
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-slate-500 text-xs">Player</p>
          <p className="font-semibold">{result.player || "Unknown"}</p>
          <p className="text-slate-500 text-xs pt-2">Card</p>
          <p className="text-sm">
            {result.year ? `${result.year} ` : ""}{result.set_name}
          </p>
          {result.grade_estimate && (
            <>
              <p className="text-slate-500 text-xs pt-2">Grade estimate</p>
              <p>{result.grade_estimate}</p>
            </>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 text-xs">Estimated value range</p>
          <p className="text-lg font-semibold text-emerald-400">
            ${result.estimated_low.toFixed(0)} – ${result.estimated_high.toFixed(0)}
          </p>
          <p className="text-[11px] text-slate-500 pt-1">
            Range is based on typical sales and grade expectations.
          </p>
        </div>
      </div>
      <details className="text-[11px] text-slate-500">
        <summary className="cursor-pointer text-slate-400">Show raw OCR</summary>
        <pre className="mt-2 whitespace-pre-wrap bg-slate-950/60 p-2 rounded border border-slate-800 text-[10px] leading-relaxed">
          {result.raw_ocr}
        </pre>
      </details>
    </div>
  );
}
