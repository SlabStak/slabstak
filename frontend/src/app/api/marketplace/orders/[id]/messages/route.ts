import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

interface MessagePayload {
  message: string;
  message_type?: string;
}

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

    // Verify user is part of this order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("buyer_id, seller_id")
      .eq("id", params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ detail: "Order not found" }, { status: 404 });
    }

    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from("order_messages")
      .select(
        `
        *,
        sender:sender_id (
          id,
          email,
          user_profiles!user_profiles_user_id_fkey (display_name)
        )
      `
      )
      .eq("order_id", params.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Messages fetch error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    // Mark unread messages as read
    await supabase
      .from("order_messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("order_id", params.id)
      .neq("sender_id", user.id);

    return NextResponse.json(
      { messages: messages || [] },
      { headers: { "Cache-Control": "private, max-age=10" } }
    );
  } catch (error) {
    console.error("Messages error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const payload: MessagePayload = await req.json();

    if (!payload.message || payload.message.trim().length === 0) {
      return NextResponse.json(
        { detail: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // Verify user is part of this order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("buyer_id, seller_id")
      .eq("id", params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ detail: "Order not found" }, { status: 404 });
    }

    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    // Create message
    const { data, error } = await supabase
      .from("order_messages")
      .insert([
        {
          order_id: params.id,
          sender_id: user.id,
          message: payload.message.trim(),
          message_type: payload.message_type || "text",
        },
      ])
      .select();

    if (error) {
      console.error("Message creation error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Message sent", data: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Message creation error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
