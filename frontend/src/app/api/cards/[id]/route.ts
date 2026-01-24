import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUserServer();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ card }, { status: 200 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUserServer();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabaseServer();

  // Only allow updating certain fields
  const allowedFields = [
    "player",
    "team",
    "sport",
    "set_name",
    "year",
    "grade_estimate",
    "estimated_low",
    "estimated_high",
    "recommendation",
    "notes",
    "status",
  ];

  const updates: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data: card, error } = await supabase
    .from("cards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to update card:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ card }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUserServer();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  // First, get the card to check ownership and get image_url
  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("id, user_id, image_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Delete image from storage if exists
  if (card.image_url) {
    try {
      // Extract the storage path from the URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/card-images/user_id/filename
      const urlParts = card.image_url.split("/card-images/");
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        const { error: storageError } = await supabase.storage
          .from("card-images")
          .remove([storagePath]);

        if (storageError) {
          console.error("Failed to delete image from storage:", storageError);
          // Continue with card deletion even if image deletion fails
        }
      }
    } catch (imageError) {
      console.error("Error deleting image:", imageError);
      // Continue with card deletion
    }
  }

  // Delete any card matches
  await supabase
    .from("user_card_matches")
    .delete()
    .eq("user_card_id", id);

  // Delete any valuations
  await supabase
    .from("card_valuations")
    .delete()
    .eq("card_id", id);

  // Delete the card
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete card:", error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Card deleted" }, { status: 200 });
}
