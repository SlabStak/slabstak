import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseClient";
import CardCatalogManager from "@/components/admin/CardCatalogManager";

export default async function CardCatalogPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect("/");

  // Check if user is admin
  const supabase = getSupabaseServer();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Card Catalog Management</h1>
          <p className="mt-2 text-gray-600">Add and manage the master card database</p>
        </div>
        <CardCatalogManager />
      </div>
    </div>
  );
}
