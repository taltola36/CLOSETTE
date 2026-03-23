/**
 * Image processor for wardrobe items.
 * Pipeline: Load (with EXIF rotation) → Auto-orient → Resize → Export
 */

const MAX_DIM = 800;
const JPEG_QUALITY = 0.85;
const PROCESSING_VERSION = 5;

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
 * Load a data URL image onto a canvas (for reprocessing stored images).
 */
function loadDataUrlToCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Auto-orient: if image is landscape (wider than tall), rotate 90° clockwise.
 * Most clothing items are portrait-oriented.
 */
function autoOrient(canvas) {
  const { width, height } = canvas;
  if (width <= height * 1.3) return canvas;

  const rotated = document.createElement('canvas');
  rotated.width = height;
  rotated.height = width;
  const ctx = rotated.getContext('2d');
  ctx.translate(height, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(canvas, 0, 0);
  return rotated;
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
 * Process a new image upload: EXIF rotation → auto-orient → resize.
 */
export async function processImage(file) {
  let canvas = await loadImageToCanvas(file);
  canvas = autoOrient(canvas);
  canvas = resizeIfNeeded(canvas);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/**
 * Reprocess a stored image (data URL): auto-orient → resize.
 */
export async function reprocessImage(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  let canvas = loadDataUrlToCanvas(img);
  canvas = autoOrient(canvas);
  canvas = resizeIfNeeded(canvas);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export { PROCESSING_VERSION };
