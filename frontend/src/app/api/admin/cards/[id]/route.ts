import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getCurrentUserServer } from "@/lib/auth";

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return data?.role === "admin";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = await isAdmin(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { is_flagged, flagged_reason } = body;

  const supabase = getSupabaseServer();

  if (is_flagged) {
    // Flag the card
    const { error } = await supabase
      .from("cards")
      .update({
        is_flagged: true,
        flagged_reason: flagged_reason || null,
        flagged_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to flag card" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Card flagged" }, { status: 200 });
  } else {
    // Unflag the card
    const { error } = await supabase
      .from("cards")
      .update({
        is_flagged: false,
        flagged_reason: null,
        flagged_at: null,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to unflag card" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Card unflagged" }, { status: 200 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUserServer();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = await isAdmin(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabaseServer();

  // First, get the card to check for image_url
  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Failed to fetch card:", fetchError);
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Delete image from storage if exists
  if (card?.image_url) {
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

  // Delete the card
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
