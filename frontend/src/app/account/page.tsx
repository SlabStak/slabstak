import { redirect } from "next/navigation";
import { getCurrentUserServer, getUserSubscription } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect("/");

  const sub = await getUserSubscription(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Account</h1>
        <p className="text-sm text-slate-300 max-w-xl">
          Manage your plan and see how SlabStak is set up for your account.
        </p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-sm">
        <p><span className="text-slate-500">Email:</span> {user.email}</p>
        <p>
          <span className="text-slate-500">Plan:</span>{" "}
          <span className="font-semibold">
            {sub?.plan ?? "free"}
          </span>
        </p>
        <p>
          <span className="text-slate-500">Status:</span>{" "}
          <span className="font-semibold">
            {sub?.status ?? "none"}
          </span>
        </p>
      </div>
    </div>
  );
}
