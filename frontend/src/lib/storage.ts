import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user ID (used for organizing files)
 * @returns The public URL and storage path
 */
export async function uploadCardImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("card-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("card-images").getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Delete an image from Supabase Storage
 * @param path - The storage path of the image
 */
export async function deleteCardImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from("card-images").remove([path]);

  if (error) {
    console.error("Delete error:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Get a signed URL for a private image (if needed in the future)
 * @param path - The storage path of the image
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("card-images")
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Signed URL error:", error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
