import { redirect } from "next/navigation";
import { getCurrentUserServer, getUserSubscription } from "@/lib/auth";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect("/");

  const sub = await getUserSubscription(user.id);

  return (
    <AccountClient
      user={{
        id: user.id,
        email: user.email ?? "",
      }}
      subscription={
        sub
          ? {
              plan: sub.plan,
              status: sub.status,
              current_period_end: sub.current_period_end,
              cancel_at_period_end: sub.cancel_at_period_end,
              stripe_customer_id: sub.stripe_customer_id,
            }
          : null
      }
    />
  );
}
