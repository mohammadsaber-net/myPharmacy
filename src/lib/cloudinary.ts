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

export async function uploadProductImage(file: File, productId: string) {
  const cloudinaryClient = configureCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<{ secureUrl: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinaryClient.uploader.upload_stream(
      {
        folder: 'saydalety/products',
        public_id: `${productId}-${Date.now()}`,
        resource_type: 'image',
        overwrite: false,
        transformation: [{ width: 1400, height: 1400, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) {
          reject(new Error('فشل رفع الصورة إلى Cloudinary. راجع إعدادات الحساب وحاول مرة أخرى.'));
          return;
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteCloudinaryImage(publicId: string) {
  if (!publicId) return;
  const cloudinaryClient = configureCloudinary();
  await cloudinaryClient.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}
