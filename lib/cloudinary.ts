import { v2 as cloudinary } from "cloudinary";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export function getCloudinaryUploadSignature(folder = "animeinfo") {
  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary environment variables are not fully configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);

  return {
    timestamp,
    folder,
    signature,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
  };
}

function isRemoteImageUrl(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function isCloudinaryAssetUrl(value?: string | null) {
  return Boolean(value && /res\.cloudinary\.com/i.test(value));
}

export async function uploadRemoteImageToCloudinary(imageUrl?: string | null, slug?: string) {
  if (!imageUrl || !isRemoteImageUrl(imageUrl) || isCloudinaryAssetUrl(imageUrl)) {
    return imageUrl || undefined;
  }

  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    return imageUrl;
  }

  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "animeinfo/rss",
      public_id: slug ? `${slug}-${Date.now()}` : undefined,
      resource_type: "image",
      unique_filename: !slug,
      overwrite: false,
    });

    return result.secure_url || imageUrl;
  } catch {
    return imageUrl;
  }
}