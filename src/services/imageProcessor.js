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
 * Sample the background color from the 4 corners of the image.
 * Returns { r, g, b, uniform } where uniform indicates if corners are similar.
 */
function sampleBackground(data, width, height) {
  const sampleSize = Math.max(1, Math.min(10, Math.floor(width / 10), Math.floor(height / 10)));
  const corners = [
    { x: 0, y: 0 },
    { x: width - sampleSize, y: 0 },
    { x: 0, y: height - sampleSize },
    { x: width - sampleSize, y: height - sampleSize },
  ];

  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  const cornerColors = [];

  for (const corner of corners) {
    let cR = 0, cG = 0, cB = 0, cCount = 0;
    for (let dy = 0; dy < sampleSize; dy++) {
      for (let dx = 0; dx < sampleSize; dx++) {
        const idx = ((corner.y + dy) * width + (corner.x + dx)) * 4;
        cR += data[idx];
        cG += data[idx + 1];
        cB += data[idx + 2];
        cCount++;
      }
    }
    cornerColors.push({
      r: Math.round(cR / cCount),
      g: Math.round(cG / cCount),
      b: Math.round(cB / cCount),
    });
    bgR += cR;
    bgG += cG;
    bgB += cB;
    bgCount += cCount;
  }

  bgR = Math.round(bgR / bgCount);
  bgG = Math.round(bgG / bgCount);
  bgB = Math.round(bgB / bgCount);

  // Check corner variance
  let variance = 0;
  for (const cc of cornerColors) {
    const dr = cc.r - bgR;
    const dg = cc.g - bgG;
    const db = cc.b - bgB;
    variance += dr * dr + dg * dg + db * db;
  }
  variance = Math.sqrt(variance / cornerColors.length);

  return { r: bgR, g: bgG, b: bgB, uniform: variance <= 80 };
}

/**
 * Remove background: replace pixels similar to the background color with white.
 * Uses edge-aware flood approach from borders to avoid removing interior areas
 * that happen to match the background color.
 */
function removeBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  if (width === 0 || height === 0) return canvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const bg = sampleBackground(data, width, height);

  // If background is not uniform, skip removal
  if (!bg.uniform) return canvas;

  const threshold = 40;

  // BFS flood fill from edges to mark background pixels
  const visited = new Uint8Array(width * height);
  const isBg = new Uint8Array(width * height);
  const queue = [];

  // Helper: check if pixel is close to background color
  const isBackgroundPixel = (idx) => {
    const dist = Math.abs(data[idx] - bg.r) +
      Math.abs(data[idx + 1] - bg.g) +
      Math.abs(data[idx + 2] - bg.b);
    return dist <= threshold;
  };

  // Seed from all border pixels
  // Use step for performance on large images
  const step = Math.max(1, Math.floor(Math.max(width, height) / 2000));

  // Top and bottom edges
  for (let x = 0; x < width; x += step) {
    queue.push(x);                          // top row
    queue.push((height - 1) * width + x);   // bottom row
  }
  // Left and right edges
  for (let y = 0; y < height; y += step) {
    queue.push(y * width);                   // left col
    queue.push(y * width + (width - 1));     // right col
  }

  // Process queue - BFS flood fill
  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    if (pos < 0 || pos >= width * height) continue;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const pixIdx = pos * 4;
    if (!isBackgroundPixel(pixIdx)) continue;

    isBg[pos] = 1;

    const x = pos % width;
    const y = (pos - x) / width;

    // Add neighbors (4-directional for speed)
    if (x > 0) queue.push(pos - 1);
    if (x < width - 1) queue.push(pos + 1);
    if (y > 0) queue.push(pos - width);
    if (y < height - 1) queue.push(pos + width);
  }

  // Apply: set background pixels to white
  for (let i = 0; i < width * height; i++) {
    if (isBg[i]) {
      const idx = i * 4;
      data[idx] = 255;     // R
      data[idx + 1] = 255; // G
      data[idx + 2] = 255; // B
      data[idx + 3] = 255; // A
    }
  }

  // Soften edges between subject and background for cleaner look
  // Simple 1px edge smoothing
  const result = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      // Check if this is an edge pixel (subject pixel next to background)
      if (!isBg[pos]) {
        const neighbors = [pos - 1, pos + 1, pos - width, pos + width];
        let bgNeighborCount = 0;
        for (const n of neighbors) {
          if (isBg[n]) bgNeighborCount++;
        }
        if (bgNeighborCount > 0 && bgNeighborCount < 4) {
          // Edge pixel - blend slightly with white for smoother transition
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

  // After background removal, background is white (255,255,255)
  // Detect non-white pixels as subject
  const whiteThreshold = 20; // distance from pure white

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
  // Fill with white first so edges are clean
  croppedCtx.fillStyle = '#FFFFFF';
  croppedCtx.fillRect(0, 0, cropW, cropH);
  croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return croppedCanvas;
}

/**
 * Apply sharpening filter using unsharp mask technique.
 * Creates a blurred version, then amplifies the difference.
 */
function sharpen(canvas, amount = 0.4) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  if (width === 0 || height === 0) return canvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const sharpened = new Uint8ClampedArray(src);

  // 3x3 sharpen convolution kernel
  // This is a balanced sharpen that enhances edges without too much noise
  const kernel = [
    0, -amount, 0,
    -amount, 1 + 4 * amount, -amount,
    0, -amount, 0,
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) { // R, G, B channels
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
 * 2. Remove background (replace with clean white)
 * 3. Smart crop to subject
 * 4. Resize for storage
 * 5. Sharpen (after resize for best results)
 * 6. Return as base64 data URL
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

  // Step 3: Remove background (flood-fill from edges → white)
  canvas = removeBackground(canvas);

  // Step 4: Smart crop to subject
  canvas = smartCrop(canvas);

  // Step 5: Resize for storage efficiency
  canvas = resizeIfNeeded(canvas);

  // Step 6: Sharpen (applied after resize for cleaner results)
  canvas = sharpen(canvas);

  // Step 7: Export as JPEG for smaller size
  return canvas.toDataURL('image/jpeg', 0.85);
}
