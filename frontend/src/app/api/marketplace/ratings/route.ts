import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

interface RatingPayload {
  order_id: string;
  rating: number;
  review_text?: string;
  communication_rating?: number;
  shipping_rating?: number;
  accuracy_rating?: number;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const payload: RatingPayload = await req.json();

    if (!payload.order_id || payload.rating === undefined) {
      return NextResponse.json(
        { detail: "order_id and rating are required" },
        { status: 400 }
      );
    }

    if (payload.rating < 1 || payload.rating > 5) {
      return NextResponse.json(
        { detail: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("buyer_id, seller_id")
      .eq("id", payload.order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ detail: "Order not found" }, { status: 404 });
    }

    // Determine who is being rated
    let ratedUserId: string;
    if (order.buyer_id === user.id) {
      ratedUserId = order.seller_id;
    } else if (order.seller_id === user.id) {
      ratedUserId = order.buyer_id;
    } else {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    // Check if already rated
    const { data: existingRating } = await supabase
      .from("user_ratings")
      .select("id")
      .eq("order_id", payload.order_id)
      .eq("rater_id", user.id)
      .single();

    if (existingRating) {
      return NextResponse.json(
        { detail: "You have already rated this order" },
        { status: 400 }
      );
    }

    // Create rating
    const { data, error } = await supabase
      .from("user_ratings")
      .insert([
        {
          order_id: payload.order_id,
          rater_id: user.id,
          rated_user_id: ratedUserId,
          rating: payload.rating,
          review_text: payload.review_text || null,
          communication_rating: payload.communication_rating || null,
          shipping_rating: payload.shipping_rating || null,
          accuracy_rating: payload.accuracy_rating || null,
        },
      ])
      .select();

    if (error) {
      console.error("Rating creation error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    // Update seller's average rating
    const { data: allRatings } = await supabase
      .from("user_ratings")
      .select("rating")
      .eq("rated_user_id", ratedUserId);

    if (allRatings) {
      const avgRating =
        allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

      await supabase
        .from("seller_profiles")
        .update({ average_rating: avgRating })
        .eq("user_id", ratedUserId);
    }

    return NextResponse.json(
      { message: "Rating submitted", rating: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Rating error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
