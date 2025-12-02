export default function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <span
      className={`inline-block ${dim} border-2 border-slate-800 border-t-sky-400 rounded-full animate-spin`}
    />
  );
}
