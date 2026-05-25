const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const UPLOAD_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined;

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

export async function uploadToCloudinary(blob: Blob): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary not configured');
  }
  const form = new FormData();
  form.append('file', blob);
  form.append('upload_preset', UPLOAD_PRESET);
  if (UPLOAD_FOLDER) form.append('folder', UPLOAD_FOLDER);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { secure_url: string; public_id: string };
  return { url: json.secure_url, publicId: json.public_id };
}
