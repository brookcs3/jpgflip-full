import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a file size in bytes to a human-readable string (KB, MB, etc.)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if the browser supports various performance features
 */
export function getBrowserCapabilities() {
  return {
    // Check if WASM is supported
    hasWasm: typeof WebAssembly === 'object',
    
    // Check if SharedArrayBuffer is supported (required for multi-threading)
    hasSharedArrayBuffer: typeof SharedArrayBuffer === 'function',
    
    // Check if Web Workers are supported
    hasWebWorker: typeof Worker === 'function',
    
    // Check if browser is Chromium-based for better AVIF support
    isChromium: navigator.userAgent.indexOf("Chrome") !== -1,
    
    // Check if the browser has proper AVIF decoding support
    hasAvifSupport: 'HTMLImageElement' in window && 'decoding' in HTMLImageElement.prototype,
    
    // Check if cross-origin isolation is enabled (needed for SharedArrayBuffer)
    isCrossOriginIsolated: window.crossOriginIsolated === true
  };
}

/**
 * Creates an optimized URL object from a blob/file that can be used for downloads
 */
export function createDownloadUrl(blob: Blob, filename: string): { url: string, download: string } {
  // Create object URL for download
  const url = URL.createObjectURL(blob);
  
  // Extract the file extension or default to .jpg
  const extension = filename.includes('.') 
    ? filename.split('.').pop()?.toLowerCase() 
    : 'jpg';
    
  // Ensure the download name has the correct extension
  const download = filename.replace(/\.[^/.]+$/, '') + '.' + 
    (extension === 'avif' ? 'jpg' : extension);
    
  return { url, download };
}

/**
 * Optimized file reader that uses the most efficient method available
 */
export async function readFileOptimized(file: File): Promise<ArrayBuffer> {
  // Use the newer .arrayBuffer() method if available (better performance)
  if (typeof file.arrayBuffer === 'function') {
    return await file.arrayBuffer();
  }
  
  // Fall back to FileReader for older browsers
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
