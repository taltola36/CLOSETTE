/**
 * Image processor for smart cropping and EXIF rotation correction.
 * Uses Canvas API - no external dependencies needed.
 */

/**
 * Read EXIF orientation from a JPEG file.
 * Returns orientation value 1-8, or 1 if not found.
 */
function readExifOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target.result);

      // Check for JPEG SOI marker
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1);
        return;
      }

      let offset = 2;
      while (offset < view.byteLength - 2) {
        const marker = view.getUint16(offset, false);
        offset += 2;

        if (marker === 0xFFE1) {
          // APP1 (EXIF) marker found
          const length = view.getUint16(offset, false);
          offset += 2;

          // Check for "Exif\0\0"
          if (
            view.getUint32(offset, false) !== 0x45786966 ||
            view.getUint16(offset + 4, false) !== 0x0000
          ) {
            resolve(1);
            return;
          }

          const tiffOffset = offset + 6;
          const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;

          const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
          const entries = view.getUint16(tiffOffset + ifdOffset, littleEndian);

          for (let i = 0; i < entries; i++) {
            const entryOffset = tiffOffset + ifdOffset + 2 + i * 12;
            if (entryOffset + 12 > view.byteLength) break;
            const tag = view.getUint16(entryOffset, littleEndian);
            if (tag === 0x0112) {
              // Orientation tag
              resolve(view.getUint16(entryOffset + 8, littleEndian));
              return;
            }
          }
          resolve(1);
          return;
        } else if ((marker & 0xFF00) === 0xFF00) {
          // Skip other markers
          offset += view.getUint16(offset, false);
        } else {
          break;
        }
      }
      resolve(1);
    };
    reader.onerror = () => resolve(1);
    // Only read the first 64KB for EXIF data
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

/**
 * Apply EXIF orientation to a canvas context.
 */
function applyOrientation(ctx, width, height, orientation) {
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, height, width); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
    default: break;
  }
}

/**
 * Load an image from a File object and correct its EXIF orientation.
 * Returns a canvas with the correctly oriented image.
 */
function loadAndOrientImage(file, img, orientation) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const { naturalWidth: w, naturalHeight: h } = img;
  const swapDimensions = orientation >= 5 && orientation <= 8;

  canvas.width = swapDimensions ? h : w;
  canvas.height = swapDimensions ? w : h;

  applyOrientation(ctx, w, h, orientation);
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
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Sample background color from corners (average of 4 corners, 10x10 px each)
  const sampleSize = Math.min(10, Math.floor(width / 10), Math.floor(height / 10));
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

  // Find bounding box of non-background pixels
  const threshold = 35; // Color distance threshold
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let foundSubject = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const dist = Math.sqrt(
        (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
      );

      if (dist > threshold) {
        foundSubject = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no clear subject found, or subject fills most of the image, return as-is
  if (!foundSubject) return canvas;

  const subjectW = maxX - minX;
  const subjectH = maxY - minY;
  if (subjectW < width * 0.1 || subjectH < height * 0.1) return canvas;
  if (subjectW > width * 0.95 && subjectH > height * 0.95) return canvas;

  // Add padding
  const padX = Math.round(width * padding);
  const padY = Math.round(height * padding);
  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(width - cropX, subjectW + padX * 2);
  const cropH = Math.min(height - cropY, subjectH + padY * 2);

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
 * 1. Read EXIF orientation
 * 2. Correct rotation
 * 3. Smart crop to subject
 * 4. Resize for storage
 * 5. Return as base64 data URL
 */
export async function processImage(file) {
  // Step 1: Read EXIF orientation
  const orientation = await readExifOrientation(file);

  // Step 2: Load image
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });

  // Step 3: Apply EXIF orientation
  let canvas = loadAndOrientImage(file, img, orientation);
  URL.revokeObjectURL(img.src);

  // Step 4: Smart crop
  canvas = smartCrop(canvas);

  // Step 5: Resize for storage efficiency
  canvas = resizeIfNeeded(canvas);

  // Step 6: Export as JPEG for smaller size
  return canvas.toDataURL('image/jpeg', 0.85);
}
