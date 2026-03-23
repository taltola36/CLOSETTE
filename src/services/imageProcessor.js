/**
 * Image processor for wardrobe items.
 * Pipeline: Load → EXIF Rotate → Background Removal → Smart Crop → Auto-Orient → Sharpen → Resize → Export
 * Uses Canvas API - no external dependencies needed.
 */

// --- Constants ---
const MAX_DIM = 800;
const JPEG_QUALITY = 0.85;
const PROCESSING_VERSION = 2;

/**
 * Load an image from a File and draw it onto a canvas.
 * Uses createImageBitmap for reliable EXIF orientation handling.
 */
async function loadImageToCanvas(file) {
  // createImageBitmap reliably applies EXIF orientation across all browsers
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Fallback for browsers without imageOrientation option
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
 * K-means clustering for color grouping.
 * Returns array of { r, g, b } centroids.
 */
function kMeansColors(pixels, k, iterations = 6) {
  if (pixels.length === 0) return [];
  k = Math.min(k, pixels.length);

  // Initialize centroids evenly spread across pixel samples
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(i * pixels.length / k);
    centroids.push({ ...pixels[idx] });
  }

  for (let iter = 0; iter < iterations; iter++) {
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (const p of pixels) {
      let bestK = 0, bestDist = Infinity;
      for (let j = 0; j < k; j++) {
        const d = (p.r - centroids[j].r) ** 2 + (p.g - centroids[j].g) ** 2 + (p.b - centroids[j].b) ** 2;
        if (d < bestDist) { bestDist = d; bestK = j; }
      }
      sums[bestK].r += p.r;
      sums[bestK].g += p.g;
      sums[bestK].b += p.b;
      sums[bestK].count++;
    }
    for (let j = 0; j < k; j++) {
      if (sums[j].count > 0) {
        centroids[j] = {
          r: Math.round(sums[j].r / sums[j].count),
          g: Math.round(sums[j].g / sums[j].count),
          b: Math.round(sums[j].b / sums[j].count),
        };
      }
    }
  }
  return centroids;
}

/**
 * Minimum squared Euclidean distance from a color to any centroid in a model.
 */
function minDistToModel(r, g, b, model) {
  let minD = Infinity;
  for (const c of model) {
    const d = (r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2;
    if (d < minD) minD = d;
  }
  return minD;
}

/**
 * GrabCut-inspired background removal.
 *
 * 1. Samples border strip → background color model (k-means clusters)
 * 2. Samples center region → foreground color model (k-means clusters)
 * 3. Classifies each pixel by which model it's closer to
 * 4. BFS flood fill from border through background-classified pixels
 * 5. Replaces background with white
 */
function removeBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  if (width < 20 || height < 20) return canvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const totalPixels = width * height;

  // --- Step 1: Sample border and center regions ---
  const borderFraction = 0.12; // outer 12%
  const centerFraction = 0.25; // inner 25% on each side (center 50%)
  const borderW = Math.max(5, Math.floor(width * borderFraction));
  const borderH = Math.max(5, Math.floor(height * borderFraction));
  const centerX1 = Math.floor(width * centerFraction);
  const centerY1 = Math.floor(height * centerFraction);
  const centerX2 = Math.floor(width * (1 - centerFraction));
  const centerY2 = Math.floor(height * (1 - centerFraction));

  const sampleStep = Math.max(1, Math.floor(Math.max(width, height) / 300));
  const borderPixels = [];
  const centerPixels = [];

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * 4;
      const pixel = { r: data[idx], g: data[idx + 1], b: data[idx + 2] };

      const inBorder = x < borderW || x >= width - borderW ||
                       y < borderH || y >= height - borderH;
      const inCenter = x >= centerX1 && x < centerX2 &&
                       y >= centerY1 && y < centerY2;

      if (inBorder) borderPixels.push(pixel);
      if (inCenter) centerPixels.push(pixel);
    }
  }

  if (borderPixels.length < 10 || centerPixels.length < 10) return canvas;

  // --- Step 2: Build color models ---
  const bgModel = kMeansColors(borderPixels, 8);
  const fgModel = kMeansColors(centerPixels, 8);

  // --- Step 3: Classify pixels & BFS flood fill from border ---
  const isBg = new Uint8Array(totalPixels);
  const visited = new Uint8Array(totalPixels);

  // Use a typed array queue for performance
  const queue = new Int32Array(totalPixels);
  let qHead = 0, qTail = 0;

  // Seed all border pixels
  for (let x = 0; x < width; x++) {
    queue[qTail++] = x;                          // top row
    queue[qTail++] = (height - 1) * width + x;   // bottom row
  }
  for (let y = 1; y < height - 1; y++) {
    queue[qTail++] = y * width;                   // left col
    queue[qTail++] = y * width + (width - 1);     // right col
  }

  while (qHead < qTail) {
    const pos = queue[qHead++];
    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];

    const bgDist = minDistToModel(r, g, b, bgModel);
    const fgDist = minDistToModel(r, g, b, fgModel);

    // Pixel must be closer to background model than foreground model
    // Use a bias factor: background needs to be clearly closer
    if (bgDist > fgDist * 0.7) continue;

    isBg[pos] = 1;

    const x = pos % width;
    const y = (pos - x) / width;

    // Expand to 4 neighbors
    if (x > 0 && !visited[pos - 1]) queue[qTail++] = pos - 1;
    if (x < width - 1 && !visited[pos + 1]) queue[qTail++] = pos + 1;
    if (y > 0 && !visited[pos - width]) queue[qTail++] = pos - width;
    if (y < height - 1 && !visited[pos + width]) queue[qTail++] = pos + width;
  }

  // --- Step 4: Safety checks ---
  let bgCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (isBg[i]) bgCount++;
  }
  if (bgCount > totalPixels * 0.92 || bgCount < totalPixels * 0.05) return canvas;

  // --- Step 5: Morphological close (dilate background then erode) ---
  // This fills small holes in the background mask
  const dilated = new Uint8Array(isBg);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (!isBg[pos]) {
        // Count background neighbors (8-connected)
        let bgN = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            if (isBg[(y + dy) * width + (x + dx)]) bgN++;
          }
        }
        // If surrounded by mostly background, it's probably background too
        if (bgN >= 6) dilated[pos] = 1;
      }
    }
  }

  // Erode back (undo dilation at true edges)
  const cleaned = new Uint8Array(dilated);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (dilated[pos] && !isBg[pos]) {
        // This was added by dilation - only keep if still surrounded
        let bgN = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            if (dilated[(y + dy) * width + (x + dx)]) bgN++;
          }
        }
        if (bgN < 5) cleaned[pos] = 0;
      }
    }
  }

  // --- Step 6: Apply white background with edge smoothing ---
  const result = new Uint8ClampedArray(data);

  for (let i = 0; i < totalPixels; i++) {
    if (cleaned[i]) {
      const idx = i * 4;
      result[idx] = 255;
      result[idx + 1] = 255;
      result[idx + 2] = 255;
      result[idx + 3] = 255;
    }
  }

  // Edge smoothing: blend subject edges with white for clean transition
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (!cleaned[pos]) {
        let bgN = 0;
        const neighbors = [pos - 1, pos + 1, pos - width, pos + width];
        for (const n of neighbors) {
          if (cleaned[n]) bgN++;
        }
        if (bgN > 0 && bgN < 4) {
          const idx = pos * 4;
          const blend = bgN * 0.12;
          result[idx] = Math.round(data[idx] * (1 - blend) + 255 * blend);
          result[idx + 1] = Math.round(data[idx + 1] * (1 - blend) + 255 * blend);
          result[idx + 2] = Math.round(data[idx + 2] * (1 - blend) + 255 * blend);
        }
      }
    }
  }

  ctx.putImageData(new ImageData(result, width, height), 0, 0);
  return canvas;
}

/**
 * Smart crop: find bounding box of non-white subject after background removal.
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
 * Auto-orient: if the clothing item appears landscape (wider than tall),
 * rotate 90° clockwise. Most clothing items are portrait-oriented.
 */
function autoOrient(canvas) {
  const { width, height } = canvas;
  // Only rotate if clearly landscape (width > 1.3x height)
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
function sharpen(canvas, amount = 0.4) {
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
  // Load with EXIF orientation applied
  let canvas = await loadImageToCanvas(file);

  // Background removal (GrabCut-inspired)
  canvas = removeBackground(canvas);

  // Crop to subject
  canvas = smartCrop(canvas);

  // Auto-orient landscape → portrait if needed
  canvas = autoOrient(canvas);

  // Resize for storage
  canvas = resizeIfNeeded(canvas);

  // Sharpen after resize for cleaner results
  canvas = sharpen(canvas);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/**
 * Reprocess an already-stored image (data URL) through the current pipeline.
 * Used for migrating existing wardrobe items to the latest processing.
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

  canvas = removeBackground(canvas);
  canvas = smartCrop(canvas);
  canvas = autoOrient(canvas);
  canvas = resizeIfNeeded(canvas);
  canvas = sharpen(canvas);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/** Current processing version - bump to trigger re-migration */
export { PROCESSING_VERSION };
