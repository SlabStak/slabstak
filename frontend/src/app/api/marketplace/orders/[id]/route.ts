import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        listing:listing_id (
          id,
          player_name,
          set_name,
          price,
          image_url,
          condition,
          grade
        ),
        buyer:buyer_id (
          id,
          email,
          user_profiles!user_profiles_user_id_fkey (display_name)
        ),
        seller:seller_id (
          id,
          email,
          user_profiles!user_profiles_user_id_fkey (display_name)
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ detail: "Order not found" }, { status: 404 });
    }

    // Verify user is involved in this order
    if (data.buyer_id !== user.id && data.seller_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { order: data },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const payload = await req.json();

    // Get order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ detail: "Order not found" }, { status: 404 });
    }

    // Verify user is involved
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    // Validate status transitions
    const validTransitions: { [key: string]: string[] } = {
      pending: ["paid", "cancelled"],
      paid: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["completed"],
      completed: [],
      cancelled: [],
      disputed: ["resolved"],
    };

    if (payload.status && !validTransitions[order.status]?.includes(payload.status)) {
      return NextResponse.json(
        {
          detail: `Cannot transition from ${order.status} to ${payload.status}`,
        },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (payload.status) updateData.status = payload.status;
    if (payload.tracking_number) updateData.tracking_number = payload.tracking_number;
    if (payload.shipped_at && order.status === "paid")
      updateData.shipped_at = new Date().toISOString();
    if (payload.payment_status) updateData.payment_status = payload.payment_status;

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", params.id)
      .select();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Order updated", order: data[0] });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
