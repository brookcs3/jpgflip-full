/**
 * Theme utilities for dynamically setting colors based on site configuration
 */
import { siteConfig } from '../config';

/**
 * Convert hex color to hsl string for CSS variables
 * @param hexColor - Hex color (e.g., #10b981)
 * @returns HSL values as string (e.g., '160 59% 40%')
 */
export function hexToHSL(hexColor: string): string {
  // Remove the # if present
  hexColor = hexColor.replace('#', '');
  
  // Convert hex to rgb
  const r = parseInt(hexColor.substr(0, 2), 16) / 255;
  const g = parseInt(hexColor.substr(2, 2), 16) / 255;
  const b = parseInt(hexColor.substr(4, 2), 16) / 255;
  
  // Find greatest and smallest channel values
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  
  let h = 0;
  let s = 0;
  let l = 0;
  
  // Calculate hue
  if (delta === 0) {
    h = 0;
  } else if (cmax === r) {
    h = ((g - b) / delta) % 6;
  } else if (cmax === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }
  
  h = Math.round(h * 60);
  
  // Make negative hues positive
  if (h < 0) h += 360;
  
  // Calculate lightness
  l = (cmax + cmin) / 2;
  
  // Calculate saturation
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  
  // Convert to percentages
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

/**
 * Apply the theme colors to CSS variables
 */
export function applyThemeColors(): void {
  // Only run in browser environment
  if (typeof document === 'undefined') return;
  
  // Get the CSS root element
  const root = document.documentElement;
  
  // Set primary color from site config
  root.style.setProperty('--primary', hexToHSL(siteConfig.primaryColor));
  
  // Set secondary color
  root.style.setProperty('--secondary', hexToHSL(siteConfig.secondaryColor));
  
  // Set accent color
  root.style.setProperty('--accent', hexToHSL(siteConfig.accentColor));
}