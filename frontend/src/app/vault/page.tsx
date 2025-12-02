import { redirect } from "next/navigation";
import { getCurrentUserServer, getUserCards } from "@/lib/auth";
import CardGrid from "@/components/vault/CardGrid";

export default async function VaultPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect("/");

  const cards = await getUserCards(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Your vault</h1>
        <p className="text-sm text-slate-300 max-w-xl">
          Every card you save after a scan lands here.
        </p>
      </div>
      <CardGrid cards={cards} />
    </div>
  );
}
