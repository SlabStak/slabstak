export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} SlabStak · Built by Murphbeck</p>
        <p>Not financial advice. Use at your own risk.</p>
      </div>
    </footer>
  );
}
