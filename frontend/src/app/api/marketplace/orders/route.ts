import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

interface OrderPayload {
  listing_id: string;
  quantity?: number;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "purchased"; // purchased, selling
    const status = searchParams.get("status") || null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        listing:listing_id (
          player_name,
          set_name,
          price,
          image_url
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
      `,
        { count: "estimated" }
      );

    if (type === "purchased") {
      query = query.eq("buyer_id", user.id);
    } else if (type === "selling") {
      query = query.eq("seller_id", user.id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Orders fetch error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        orders: data || [],
        total: count || 0,
        limit,
        offset,
      },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (error) {
    console.error("Orders error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const payload: OrderPayload = await req.json();

    if (!payload.listing_id) {
      return NextResponse.json(
        { detail: "listing_id is required" },
        { status: 400 }
      );
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", payload.listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ detail: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { detail: "Listing is no longer available" },
        { status: 400 }
      );
    }

    // Calculate totals
    const itemPrice = listing.price;
    const shippingCost = listing.shipping_cost || 0;
    const platformFee = itemPrice * 0.1; // 10% platform fee
    const totalAmount = itemPrice + shippingCost + platformFee;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          listing_id: payload.listing_id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          item_price: itemPrice,
          shipping_cost: shippingCost,
          platform_fee: platformFee,
          total_amount: totalAmount,
          status: "pending",
          payment_status: "unpaid",
          escrow_status: "pending",
        },
      ])
      .select();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ detail: orderError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: "Order created",
        order: order[0],
        next_step: "payment",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
