import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

interface ListingPayload {
  card_id?: string;
  catalog_card_id?: string;
  player_name: string;
  set_name: string;
  card_number?: string;
  year?: number;
  sport?: string;
  condition: string;
  grade?: string;
  price: number;
  shipping_method: string;
  shipping_cost?: number;
  ships_to_countries?: string[];
  description?: string;
  image_url?: string;
  additional_images?: string[];
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "active";
    const sport = searchParams.get("sport") || null;
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : null;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : null;
    const q = searchParams.get("q") || null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    let query = supabase
      .from("listings")
      .select("*, seller:seller_id(id, email)", { count: "estimated" })
      .eq("status", status);

    if (sport) {
      query = query.eq("sport", sport);
    }
    if (minPrice) {
      query = query.gte("price", minPrice);
    }
    if (maxPrice) {
      query = query.lte("price", maxPrice);
    }
    if (q) {
      query = query.or(`player_name.ilike.%${q}%,set_name.ilike.%${q}%,condition.ilike.%${q}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Listings fetch error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        listings: data || [],
        total: count || 0,
        limit,
        offset,
      },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (error) {
    console.error("Listings error:", error);
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
    const payload: ListingPayload = await req.json();

    // Validate required fields
    if (!payload.player_name || !payload.set_name || !payload.price) {
      return NextResponse.json(
        { detail: "Missing required fields: player_name, set_name, price" },
        { status: 400 }
      );
    }

    if (payload.price < 0) {
      return NextResponse.json(
        { detail: "Price must be positive" },
        { status: 400 }
      );
    }

    // Get seller name from profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    // Insert listing
    const { data, error } = await supabase
      .from("listings")
      .insert([
        {
          seller_id: user.id,
          card_id: payload.card_id || null,
          catalog_card_id: payload.catalog_card_id || null,
          player_name: payload.player_name,
          set_name: payload.set_name,
          card_number: payload.card_number || null,
          year: payload.year || null,
          sport: payload.sport || null,
          condition: payload.condition,
          grade: payload.grade || null,
          price: payload.price,
          shipping_method: payload.shipping_method,
          shipping_cost: payload.shipping_cost || 0,
          ships_to_countries: payload.ships_to_countries || ["US"],
          description: payload.description || null,
          image_url: payload.image_url || null,
          additional_images: payload.additional_images || [],
          seller_name: profile?.display_name || user.email,
        },
      ])
      .select();

    if (error) {
      console.error("Listing creation error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Listing created", listing: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Listing creation error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
