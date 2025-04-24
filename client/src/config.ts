/**
 * Site configuration
 * This file contains site-specific settings that change based on which
 * domain/brand is being displayed.
 */

// Define site configuration types
export interface SiteConfig {
  siteName: string;
  defaultConversionMode: 'avifToJpg' | 'jpgToAvif';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoText: string;
  domain: string;
}

// Simplified configuration for JPGFlip-only repository
export function getSiteConfig(): SiteConfig {
  // Always return JPGFlip configuration for this repository
  return {
    siteName: 'JPGFlip',
    defaultConversionMode: 'jpgToAvif',
    primaryColor: '#10b981', // Green
    secondaryColor: '#059669',
    accentColor: '#34d399',
    logoText: 'JPGFlip',
    domain: 'jpgflip.com'
  };
}

// Export the current site configuration
export const siteConfig = getSiteConfig();