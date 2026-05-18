import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadResult = {
  path: string;
  publicUrl: string;
};

export type UploadProgress = {
  loaded: number;
  total: number;
};

// ─── Bucket names ─────────────────────────────────────────────────────────────

export const BUCKETS = {
  ultOrderMedia: "ult-order-media",
  avatars:       "avatars",
  restaurants:   "restaurant-images",
} as const;

// ─── Core upload ──────────────────────────────────────────────────────────────

/**
 * uploadMedia — the primary function for the create flow.
 * Uploads a photo or video asset to Supabase Storage under
 * ult-order-media/{userId}/{timestamp}.{ext}
 *
 * Returns the public URL and storage path on success.
 */
export async function uploadMedia(
  asset: ImagePicker.ImagePickerAsset,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const ext = getExtension(asset);
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const mimeType = getMimeType(asset, ext);

  // Fetch the local file as a Blob
  const response = await fetch(asset.uri);
  if (!response.ok) {
    throw new Error(`Failed to read local file: ${asset.uri}`);
  }
  const blob = await response.blob();

  // Report approximate start (fetch API doesn't expose progress)
  onProgress?.({ loaded: 0, total: blob.size });

  const { data, error } = await supabase.storage
    .from(BUCKETS.ultOrderMedia)
    .upload(fileName, blob, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  onProgress?.({ loaded: blob.size, total: blob.size });

  const { data: urlData } = supabase.storage
    .from(BUCKETS.ultOrderMedia)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * uploadMultiple — upload an array of assets, resolving one at a time.
 * Returns results in the same order as inputs.
 */
export async function uploadMultiple(
  assets: ImagePicker.ImagePickerAsset[],
  userId: string,
  onEachProgress?: (index: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  for (let i = 0; i < assets.length; i++) {
    const result = await uploadMedia(assets[i], userId, (p) =>
      onEachProgress?.(i, p)
    );
    results.push(result);
  }
  return results;
}

/**
 * uploadAvatar — upload a profile picture to the avatars bucket.
 */
export async function uploadAvatar(
  asset: ImagePicker.ImagePickerAsset,
  userId: string
): Promise<UploadResult> {
  const ext = getExtension(asset);
  const fileName = `${userId}/avatar.${ext}`;
  const mimeType = getMimeType(asset, ext);

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from(BUCKETS.avatars)
    .upload(fileName, blob, {
      contentType: mimeType,
      upsert: true, // overwrite existing avatar
    });

  if (error) throw new Error(`Avatar upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKETS.avatars)
    .getPublicUrl(data.path);

  return { path: data.path, publicUrl: urlData.publicUrl };
}

/**
 * deleteFile — remove a file from a bucket by its storage path.
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ─── Image picker helpers ─────────────────────────────────────────────────────

/**
 * pickImages — request library permission and open multi-select picker.
 * Returns up to `maxCount` photo assets.
 */
export async function pickImages(
  maxCount: number = 3
): Promise<ImagePicker.ImagePickerAsset[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission not granted.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: 0.85,
    exif: false,
  });

  if (result.canceled) return [];
  return result.assets;
}

/**
 * pickVideo — open picker limited to video, max 15 seconds.
 */
export async function pickVideo(): Promise<ImagePicker.ImagePickerAsset | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission not granted.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    videoMaxDuration: 15,
    quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
  });

  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

/**
 * takePhoto — open camera for a single photo.
 */
export async function takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Camera permission not granted.");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
  });

  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getExtension(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.uri) {
    const match = asset.uri.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    if (match) return match[1].toLowerCase();
  }
  return asset.type === "video" ? "mp4" : "jpg";
}

function getMimeType(
  asset: ImagePicker.ImagePickerAsset,
  ext: string
): string {
  if (asset.mimeType) return asset.mimeType;
  if (asset.type === "video") {
    return ext === "mov" ? "video/quicktime" : "video/mp4";
  }
  const imgMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
  };
  return imgMap[ext] ?? "image/jpeg";
}
