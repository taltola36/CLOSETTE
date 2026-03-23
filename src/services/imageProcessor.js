/**
 * Image processor for wardrobe items.
 * Pipeline: Load (with EXIF rotation) → Resize → Export
 */

const MAX_DIM = 800;
const JPEG_QUALITY = 0.85;
const PROCESSING_VERSION = 4;

/**
 * Load image with reliable EXIF orientation handling.
 */
async function loadImageToCanvas(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    bitmap = await createImageBitmap(file);
  }

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

/**
 * Resize canvas if it exceeds max dimensions.
 */
function resizeIfNeeded(canvas, maxDim = MAX_DIM) {
  const { width, height } = canvas;
  if (width <= maxDim && height <= maxDim) return canvas;

  const scale = maxDim / Math.max(width, height);
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);

  const resized = document.createElement('canvas');
  resized.width = newW;
  resized.height = newH;
  const ctx = resized.getContext('2d');
  ctx.drawImage(canvas, 0, 0, newW, newH);
  return resized;
}

/**
 * Process a new image upload: apply EXIF rotation + resize.
 */
export async function processImage(file) {
  let canvas = await loadImageToCanvas(file);
  canvas = resizeIfNeeded(canvas);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export { PROCESSING_VERSION };
