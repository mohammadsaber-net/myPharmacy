import { v2 as cloudinary } from 'cloudinary';

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('إعدادات Cloudinary غير مكتملة. أضف CLOUDINARY_CLOUD_NAME وCLOUDINARY_API_KEY وCLOUDINARY_API_SECRET إلى ملف .env.');
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

export type UploadedProductImage = { secureUrl: string; publicId: string };

export async function uploadProductImage(file: File, productId: string): Promise<UploadedProductImage> {
  const client = configureCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream({
      folder: 'saydalety/products',
      public_id: `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      resource_type: 'image',
      overwrite: false,
      transformation: [{ width: 1400, height: 1400, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
    }, (error, result) => {
      if (error || !result?.secure_url || !result.public_id) {
        reject(new Error('فشل رفع الصورة إلى Cloudinary. راجع إعدادات الحساب وحاول مرة أخرى.'));
        return;
      }
      resolve({ secureUrl: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

export async function deleteCloudinaryImage(publicId: string) {
  if (!publicId) return;
  const client = configureCloudinary();
  const result = await client.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary image deletion returned: ${result.result}`);
  }
}

export async function deleteCloudinaryImages(publicIds: string[]) {
  let pending = [...new Set(publicIds.filter(Boolean))];
  const failures = new Map<string, unknown>();
  for (let attempt = 0; attempt < 3 && pending.length; attempt += 1) {
    const current = pending;
    const results = await Promise.allSettled(current.map(deleteCloudinaryImage));
    pending = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        pending.push(current[index]);
        failures.set(current[index], result.reason);
      } else failures.delete(current[index]);
    });
  }
  return [...failures].map(([publicId, error]) => ({ publicId, error }));
}
