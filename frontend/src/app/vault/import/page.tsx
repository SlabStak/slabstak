import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/auth";
import CSVImporter from "@/components/vault/CSVImporter";

export default async function ImportPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect("/");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Import Cards</h1>
        <p className="text-sm text-slate-300 max-w-xl">
          Upload a CSV file to bulk import your card collection. Map your CSV columns to SlabStak fields.
        </p>
      </div>

      <CSVImporter />
    </div>
  );
}
