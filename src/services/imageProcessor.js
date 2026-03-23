/**
 * Image processor for wardrobe items.
 * Pipeline: Load → EXIF Rotate → ML Background Removal → Smart Crop → Auto-Orient → Sharpen → Resize → Export
 *
 * Uses @imgly/background-removal for neural-network based background removal
 * that runs entirely in the browser (WASM/WebGL).
 */
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

const MAX_DIM = 800;
const JPEG_QUALITY = 0.85;
const PROCESSING_VERSION = 3;

/**
 * Remove background using ML model. Returns a canvas with transparent background.
 */
async function mlRemoveBackground(imageSource) {
  const blob = await imglyRemoveBackground(imageSource, {
    model: 'small',
    output: { format: 'image/png', quality: 1 },
  });

  // Convert blob to canvas
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(blob);
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');

  // White background + foreground with transparency
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  URL.revokeObjectURL(img.src);
  return canvas;
}

/**
 * Smart crop: find bounding box of non-white subject.
 */
function smartCrop(canvas, padding = 0.04) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  if (width === 0 || height === 0) return canvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const whiteThreshold = 25;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let foundSubject = false;
  const step = Math.max(1, Math.floor(Math.max(width, height) / 1000));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const dist = Math.abs(data[idx] - 255) +
        Math.abs(data[idx + 1] - 255) +
        Math.abs(data[idx + 2] - 255);
      if (dist > whiteThreshold) {
        foundSubject = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!foundSubject) return canvas;

  const subjectW = maxX - minX;
  const subjectH = maxY - minY;
  if (subjectW < width * 0.08 || subjectH < height * 0.08) return canvas;
  if (subjectW > width * 0.95 && subjectH > height * 0.95) return canvas;

  const padX = Math.round(width * padding);
  const padY = Math.round(height * padding);
  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(width - cropX, maxX - cropX + padX + 1);
  const cropH = Math.min(height - cropY, maxY - cropY + padY + 1);
  if (cropW <= 0 || cropH <= 0) return canvas;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.fillStyle = '#FFFFFF';
  croppedCtx.fillRect(0, 0, cropW, cropH);
  croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return croppedCanvas;
}

/**
 * Auto-orient: if the clothing item appears landscape, rotate 90° clockwise.
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
 * Apply sharpening filter using unsharp mask convolution kernel.
 */
function sharpen(canvas, amount = 0.3) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  if (width === 0 || height === 0) return canvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const sharpened = new Uint8ClampedArray(src);

  const kernel = [
    0, -amount, 0,
    -amount, 1 + 4 * amount, -amount,
    0, -amount, 0,
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        let val = 0, ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            val += src[((y + ky) * width + (x + kx)) * 4 + c] * kernel[ki++];
          }
        }
        sharpened[idx + c] = Math.round(val);
      }
    }
  }

  ctx.putImageData(new ImageData(sharpened, width, height), 0, 0);
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
 * Full processing pipeline for new image uploads.
 */
export async function processImage(file) {
  // ML background removal (handles EXIF orientation internally)
  let canvas = await mlRemoveBackground(file);

  canvas = smartCrop(canvas);
  canvas = autoOrient(canvas);
  canvas = resizeIfNeeded(canvas);
  canvas = sharpen(canvas);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/**
 * Reprocess an already-stored image (data URL) through the current pipeline.
 * Used for migrating existing wardrobe items to the latest processing.
 */
export async function reprocessImage(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;

  // Convert data URL to blob for the ML model
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  let canvas = await mlRemoveBackground(blob);

  canvas = smartCrop(canvas);
  canvas = autoOrient(canvas);
  canvas = resizeIfNeeded(canvas);
  canvas = sharpen(canvas);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export { PROCESSING_VERSION };
