import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row items-center gap-10">
        <div className="space-y-6 flex-1">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-400">
            SlabStak • AI Card Intel
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Know what your cards are worth{" "}
            <span className="text-sky-400">before</span> you sell.
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl">
            Upload a photo of any graded or raw sports card. SlabStak reads the slab,
            runs real-time market intelligence, and gives you{" "}
            <span className="font-semibold">grade, value range, and a flip/hold call</span>{" "}
            in seconds.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/scan"
              className="px-5 py-2.5 rounded-full bg-sky-500 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition"
            >
              Scan a card
            </Link>
            <Link
              href="/pricing"
              className="px-5 py-2.5 rounded-full border border-slate-700 text-sm font-semibold hover:border-sky-500 transition"
            >
              View pricing
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            Built by Murphbeck • Early access • Not financial advice.
          </p>
        </div>
        <div className="flex-1 w-full">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl">
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Example scan</span>
                <span className="text-emerald-400">Flip potential: High</span>
              </div>
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 text-xs space-y-1">
                <p><span className="text-slate-500">Player:</span> Shohei Ohtani</p>
                <p><span className="text-slate-500">Card:</span> 2018 Topps Chrome Rookie</p>
                <p><span className="text-slate-500">Grade est:</span> PSA 9-10 (raw)</p>
                <p><span className="text-slate-500">Value range:</span> $240 – $310</p>
                <p><span className="text-slate-500">Call:</span> <span className="text-emerald-400 font-semibold">HOLD</span></p>
              </div>
              <p className="text-[11px] text-slate-500">
                SlabStak combines OCR, AI grading heuristics, and live comp data to give you a fast, explainable range —
                then tells you whether to flip, hold, grade, or bundle.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
