/**
 * Image compression utility using Canvas API
 * Compresses images to a maximum size (default 1MB) with iterative quality reduction
 */

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_DIMENSION = 1920; // Max width or height
const INITIAL_QUALITY = 0.9;
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.3;

export interface SerializedImage {
  name: string;
  type: string;
  base64: string;
}

/**
 * Compress an image file to under the target size
 */
export async function compressImage(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): Promise<File> {
  // Only process images
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  // If already under max size and not too large dimensions, return as-is
  if (file.size <= maxSize) {
    const img = await loadImage(file);
    if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
      return file;
    }
  }

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.width, img.height);

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Try different quality levels until under max size
  let quality = INITIAL_QUALITY;
  let blob: Blob | null = null;

  while (quality >= MIN_QUALITY) {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    
    if (blob.size <= maxSize) {
      break;
    }
    
    quality -= QUALITY_STEP;
  }

  if (!blob || blob.size > maxSize) {
    // If still too large, reduce dimensions further
    const scaleFactor = Math.sqrt(maxSize / (blob?.size || file.size));
    const newWidth = Math.floor(width * scaleFactor);
    const newHeight = Math.floor(height * scaleFactor);
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    blob = await canvasToBlob(canvas, 'image/jpeg', MIN_QUALITY);
  }

  // Create new file with compressed data
  const compressedFile = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, '.jpg'),
    { type: 'image/jpeg' }
  );

  return compressedFile;
}

/**
 * Load an image from a File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }

  const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.floor(width * ratio),
    height: Math.floor(height * ratio),
  };
}

/**
 * Convert canvas to blob with specified format and quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Convert a File to a base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a base64 string back to a File
 */
export function base64ToFile(
  base64: string,
  filename: string,
  mimeType: string
): File {
  const arr = base64.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mimeType });
}

/**
 * Serialize an array of Files to a storable format
 */
export async function serializeImages(files: File[]): Promise<SerializedImage[]> {
  const serialized: SerializedImage[] = [];
  
  for (const file of files) {
    const base64 = await fileToBase64(file);
    serialized.push({
      name: file.name,
      type: file.type,
      base64,
    });
  }
  
  return serialized;
}

/**
 * Deserialize stored images back to File objects
 */
export function deserializeImages(serialized: SerializedImage[]): File[] {
  return serialized.map((img) => base64ToFile(img.base64, img.name, img.type));
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  maxSize: number = MAX_FILE_SIZE
): Promise<File[]> {
  const compressionPromises = files.map((file) => compressImage(file, maxSize));
  return Promise.all(compressionPromises);
}

