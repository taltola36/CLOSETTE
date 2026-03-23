/**
 * Image processor for smart cropping and optimization.
 * Uses Canvas API - no external dependencies needed.
 *
 * Note: Modern browsers auto-apply EXIF orientation when loading images,
 * so we don't need manual EXIF rotation correction.
 */

/**
 * Load an image from a File and draw it onto a canvas.
 */
function loadImageToCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Smart crop: find the bounding box of the main subject
 * by detecting non-background pixels.
 */
function smartCrop(canvas, padding = 0.03) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  if (width === 0 || height === 0) return canvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Sample background color from corners (average of 4 corners, NxN px each)
  const sampleSize = Math.max(1, Math.min(10, Math.floor(width / 10), Math.floor(height / 10)));
  const corners = [
    { x: 0, y: 0 },
    { x: width - sampleSize, y: 0 },
    { x: 0, y: height - sampleSize },
    { x: width - sampleSize, y: height - sampleSize },
  ];

  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (const corner of corners) {
    for (let dy = 0; dy < sampleSize; dy++) {
      for (let dx = 0; dx < sampleSize; dx++) {
        const idx = ((corner.y + dy) * width + (corner.x + dx)) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        bgCount++;
      }
    }
  }
  bgR = Math.round(bgR / bgCount);
  bgG = Math.round(bgG / bgCount);
  bgB = Math.round(bgB / bgCount);

  // Check if corners are similar enough to be considered a uniform background
  let cornerVariance = 0;
  for (const corner of corners) {
    const idx = (corner.y * width + corner.x) * 4;
    const dr = data[idx] - bgR;
    const dg = data[idx + 1] - bgG;
    const db = data[idx + 2] - bgB;
    cornerVariance += dr * dr + dg * dg + db * db;
  }
  cornerVariance = Math.sqrt(cornerVariance / corners.length);

  // If corners are very different from each other, background is not uniform - skip crop
  if (cornerVariance > 80) return canvas;

  // Find bounding box of non-background pixels
  const threshold = 35;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let foundSubject = false;

  // Sample every 2nd pixel for performance on large images
  const step = Math.max(1, Math.floor(Math.max(width, height) / 1000));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

      if (dist > threshold) {
        foundSubject = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no clear subject found, return as-is
  if (!foundSubject) return canvas;

  const subjectW = maxX - minX;
  const subjectH = maxY - minY;

  // Skip if subject is too small (noise) or fills most of the image already
  if (subjectW < width * 0.1 || subjectH < height * 0.1) return canvas;
  if (subjectW > width * 0.92 && subjectH > height * 0.92) return canvas;

  // Add padding
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
  croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return croppedCanvas;
}

/**
 * Resize canvas if it exceeds max dimensions (for localStorage storage).
 */
function resizeIfNeeded(canvas, maxDim = 800) {
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
 * Main processing pipeline:
 * 1. Load image (browser auto-handles EXIF orientation)
 * 2. Smart crop to subject
 * 3. Resize for storage
 * 4. Return as base64 data URL
 */
export async function processImage(file) {
  // Step 1: Load image - browser auto-corrects EXIF orientation
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });

  // Step 2: Draw to canvas
  let canvas = loadImageToCanvas(img);
  URL.revokeObjectURL(img.src);

  // Step 3: Smart crop
  canvas = smartCrop(canvas);

  // Step 4: Resize for storage efficiency
  canvas = resizeIfNeeded(canvas);

  // Step 5: Export as JPEG for smaller size
  return canvas.toDataURL('image/jpeg', 0.85);
}
