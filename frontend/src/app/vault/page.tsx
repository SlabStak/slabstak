import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserServer, getUserCards } from "@/lib/auth";
import CardGrid from "@/components/vault/CardGrid";

export default async function VaultPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect("/");

  const cards = await getUserCards(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold">Your vault</h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Every card you save after a scan lands here.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/catalog"
            className="px-4 py-2 bg-sky-500 text-slate-950 rounded-lg font-semibold hover:bg-sky-400 transition-colors"
          >
            🔍 Browse Catalog
          </Link>
        </div>
      </div>
      <CardGrid cards={cards} />
    </div>
  );
}
