import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'deqohhami',
  api_key: process.env.CLOUDINARY_API_KEY || '848753131857721',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'frihe6o7KJJzCLYUucvzJBbg6HQ',
  secure: true,
});

/**
 * Upload image buffer to Cloudinary in Cards or houses subfolder
 * @param {Object} params
 * @param {Buffer} params.buffer - Image buffer
 * @param {string} params.fileName - Target file name
 * @param {string} params.type - 'card' | 'house'
 */
export async function uploadToCloudinary({ buffer, fileName, type }) {
  const baseFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'village-finance';

  let subfolder = '';
  const lowerType = String(type || '').toLowerCase();
  if (lowerType.includes('card')) {
    subfolder = 'Cards';
  } else if (lowerType.includes('house')) {
    subfolder = 'houses';
  }

  const targetFolder = subfolder ? `${baseFolder}/${subfolder}` : baseFolder;
  const cleanId = (fileName || `img_${Date.now()}`)
    .replace(/\.[^/.]+$/, '') // strip existing extension
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        public_id: cleanId,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          folder: targetFolder,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export default cloudinary;
