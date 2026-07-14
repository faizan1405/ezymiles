import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { integrations } from "@/lib/env";

/**
 * Cloudinary media handling.
 *
 * Uploads are signed on the server and performed direct-to-Cloudinary from the
 * browser, so large files never pass through our function. The signature pins
 * the folder and timestamp, and Cloudinary itself enforces the allowed formats —
 * a client cannot widen either.
 */

function configured() {
  if (!integrations.cloudinary) return false;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return true;
}

export const ALLOWED_FOLDERS = [
  "destinations",
  "packages",
  "hotels",
  "activities",
  "offers",
  "blog",
  "reviews",
  "visa",
  "brand",
  "general",
] as const;

export type MediaFolder = (typeof ALLOWED_FOLDERS)[number];

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function signUpload(folder: MediaFolder): UploadSignature | null {
  if (!configured()) return null;

  const timestamp = Math.round(Date.now() / 1000);
  const path = `voyara/${folder}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: path,
      // Everything is normalised to a sensible max on the way in — a 40 MP
      // camera original has no business being served to a phone.
      transformation: "c_limit,w_2400,q_auto:good",
    },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: path,
  };
}

export async function destroyAsset(publicId: string) {
  if (!configured()) return;
  await cloudinary.uploader.destroy(publicId);
}

export const isCloudinaryConfigured = () => integrations.cloudinary;
