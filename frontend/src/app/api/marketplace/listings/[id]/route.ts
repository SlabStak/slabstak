import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer();

    // Increment view count
    await supabase
      .from("listings")
      .update({ views_count: supabase.rpc("increment_views", { id: params.id }) })
      .eq("id", params.id);

    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        seller:seller_id (
          id,
          email,
          user_profiles!user_profiles_user_id_fkey (display_name, created_at)
        ),
        seller_rating:seller_id (
          id,
          seller_profiles!seller_profiles_user_id_fkey (average_rating, total_sales)
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ detail: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(
      { listing: data },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (error) {
    console.error("Listing detail error:", error);
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

    // Verify ownership
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ detail: "Listing not found" }, { status: 404 });
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();

    // Only allow certain fields to be updated
    const updateData: any = {};
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.condition !== undefined) updateData.condition = payload.condition;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.shipping_cost !== undefined) updateData.shipping_cost = payload.shipping_cost;
    if (payload.status !== undefined) updateData.status = payload.status;

    const { data, error } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", params.id)
      .select();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Listing updated", listing: data[0] });
  } catch (error) {
    console.error("Listing update error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // Verify ownership
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ detail: "Listing not found" }, { status: 404 });
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("listings").delete().eq("id", params.id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Listing deleted" });
  } catch (error) {
    console.error("Listing delete error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
