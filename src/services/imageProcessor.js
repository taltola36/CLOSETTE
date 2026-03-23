/**
 * Image processor for wardrobe items.
 * Pipeline: Load → Background Removal → Smart Crop → Sharpen → Resize → Export
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
 * Remove background using adaptive flood-fill from image borders.
 *
 * Instead of comparing against a single average background color (which fails
 * on textured backgrounds like wood floors, carpets, tables), this uses
 * "relative threshold" BFS: each pixel is compared to its PARENT in the flood,
 * so gradual color transitions in the background are followed naturally.
 *
 * Additionally, we prevent the flood from entering the center region too aggressively
 * by using a stricter threshold for pixels closer to the image center.
 */
function removeBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  if (width === 0 || height === 0) return canvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const totalPixels = width * height;

  // --- Step 1: Build border color palette ---
  // Sample every border pixel to understand the background color range
  const borderStep = Math.max(1, Math.floor(Math.max(width, height) / 500));
  const borderColors = [];

  // Top & bottom rows
  for (let x = 0; x < width; x += borderStep) {
    borderColors.push(x);                          // top
    borderColors.push((height - 1) * width + x);   // bottom
  }
  // Left & right columns
  for (let y = 0; y < height; y += borderStep) {
    borderColors.push(y * width);                   // left
    borderColors.push(y * width + (width - 1));     // right
  }

  // --- Step 2: Cluster border colors (simple k-means, k=5) ---
  // This captures multiple background tones (e.g. light & dark wood grain)
  const K = Math.min(5, borderColors.length);
  let centroids = [];
  for (let i = 0; i < K; i++) {
    const pos = borderColors[Math.floor(i * borderColors.length / K)];
    const idx = pos * 4;
    centroids.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }

  // Run 5 iterations of k-means
  for (let iter = 0; iter < 5; iter++) {
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (const pos of borderColors) {
      const idx = pos * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      let bestK = 0, bestDist = Infinity;
      for (let k = 0; k < K; k++) {
        const d = Math.abs(r - centroids[k].r) + Math.abs(g - centroids[k].g) + Math.abs(b - centroids[k].b);
        if (d < bestDist) { bestDist = d; bestK = k; }
      }
      sums[bestK].r += r;
      sums[bestK].g += g;
      sums[bestK].b += b;
      sums[bestK].count++;
    }
    for (let k = 0; k < K; k++) {
      if (sums[k].count > 0) {
        centroids[k] = {
          r: Math.round(sums[k].r / sums[k].count),
          g: Math.round(sums[k].g / sums[k].count),
          b: Math.round(sums[k].b / sums[k].count),
        };
      }
    }
  }

  // --- Step 3: BFS flood fill from borders ---
  // A pixel is "background" if it matches ANY of the border color clusters
  // AND is reachable from the border through similar pixels.
  const baseThreshold = 45;
  const visited = new Uint8Array(totalPixels);
  const isBg = new Uint8Array(totalPixels);

  const matchesBgPalette = (idx) => {
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    for (let k = 0; k < K; k++) {
      const d = Math.abs(r - centroids[k].r) + Math.abs(g - centroids[k].g) + Math.abs(b - centroids[k].b);
      if (d <= baseThreshold) return true;
    }
    return false;
  };

  // Also check relative similarity to parent pixel (handles gradients/textures)
  const isSimilar = (idx1, idx2, thresh) => {
    return Math.abs(data[idx1] - data[idx2]) +
      Math.abs(data[idx1 + 1] - data[idx2 + 1]) +
      Math.abs(data[idx1 + 2] - data[idx2 + 2]) <= thresh;
  };

  // Center protection: pixels near center need stricter matching
  const cx = width / 2, cy = height / 2;
  const maxDistFromCenter = Math.sqrt(cx * cx + cy * cy);

  // Seed queue with all border pixels - store [position, parentPosition]
  const queue = [];
  // Top & bottom
  for (let x = 0; x < width; x++) {
    queue.push([x, x]);
    queue.push([(height - 1) * width + x, (height - 1) * width + x]);
  }
  // Left & right
  for (let y = 1; y < height - 1; y++) {
    queue.push([y * width, y * width]);
    queue.push([y * width + width - 1, y * width + width - 1]);
  }

  let head = 0;
  while (head < queue.length) {
    const [pos, parentPos] = queue[head++];
    if (pos < 0 || pos >= totalPixels) continue;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const pixIdx = pos * 4;
    const parentIdx = parentPos * 4;

    // Must match the background palette OR be very similar to parent
    const matchesPalette = matchesBgPalette(pixIdx);
    const similarToParent = isSimilar(pixIdx, parentIdx, 30);

    if (!matchesPalette && !similarToParent) continue;

    // Center protection: require palette match for pixels near center
    const px = pos % width;
    const py = (pos - px) / width;
    const distFromEdge = Math.min(px, py, width - 1 - px, height - 1 - py);
    const edgeFraction = distFromEdge / Math.min(width, height) * 2;

    // Deep into center: must match palette (not just similar to parent)
    if (edgeFraction > 0.35 && !matchesPalette) continue;

    isBg[pos] = 1;

    const x = pos % width;
    const y = (pos - x) / width;

    if (x > 0) queue.push([pos - 1, pos]);
    if (x < width - 1) queue.push([pos + 1, pos]);
    if (y > 0) queue.push([pos - width, pos]);
    if (y < height - 1) queue.push([pos + width, pos]);
  }

  // --- Step 4: Verify we didn't remove the entire image ---
  let bgCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (isBg[i]) bgCount++;
  }
  // If more than 95% marked as background, something went wrong - skip
  if (bgCount > totalPixels * 0.95) return canvas;
  // If less than 5% marked as background, nothing useful to remove
  if (bgCount < totalPixels * 0.05) return canvas;

  // --- Step 5: Apply white background ---
  for (let i = 0; i < totalPixels; i++) {
    if (isBg[i]) {
      const idx = i * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }

  // --- Step 6: Edge smoothing ---
  const result = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (!isBg[pos]) {
        const neighbors = [pos - 1, pos + 1, pos - width, pos + width];
        let bgNeighborCount = 0;
        for (const n of neighbors) {
          if (isBg[n]) bgNeighborCount++;
        }
        if (bgNeighborCount > 0 && bgNeighborCount < 4) {
          const idx = pos * 4;
          const blend = bgNeighborCount * 0.15;
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
 * Smart crop: find the bounding box of the main subject
 * by detecting non-white pixels (runs after background removal).
 */
function smartCrop(canvas, padding = 0.03) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  if (width === 0 || height === 0) return canvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const whiteThreshold = 20;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let foundSubject = false;

  const step = Math.max(1, Math.floor(Math.max(width, height) / 1000));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const distFromWhite = Math.abs(data[idx] - 255) +
        Math.abs(data[idx + 1] - 255) +
        Math.abs(data[idx + 2] - 255);

      if (distFromWhite > whiteThreshold) {
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

  if (subjectW < width * 0.1 || subjectH < height * 0.1) return canvas;
  if (subjectW > width * 0.92 && subjectH > height * 0.92) return canvas;

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
        let val = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const srcIdx = ((y + ky) * width + (x + kx)) * 4 + c;
            val += src[srcIdx] * kernel[ki++];
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
 * 1. Load image (browser auto-handles EXIF orientation/rotation)
 * 2. Remove background (adaptive flood-fill → white)
 * 3. Smart crop to subject
 * 4. Resize for storage
 * 5. Sharpen (after resize for best results)
 * 6. Return as base64 data URL
 */
export async function processImage(file) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });

  let canvas = loadImageToCanvas(img);
  URL.revokeObjectURL(img.src);

  canvas = removeBackground(canvas);
  canvas = smartCrop(canvas);
  canvas = resizeIfNeeded(canvas);
  canvas = sharpen(canvas);

  return canvas.toDataURL('image/jpeg', 0.85);
}
