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

// Determine which configuration to use based on hostname
export function getSiteConfig(): SiteConfig {
  const hostname = window.location.hostname;
  
  // Use jpgflip config when on jpgflip.com
  if (hostname.includes('jpgflip.com')) {
    return {
      siteName: 'JPGFlip',
      defaultConversionMode: 'jpgToAvif',
      primaryColor: '#2563eb', // Blue
      secondaryColor: '#4f46e5',
      accentColor: '#3b82f6',
      logoText: 'JPGFlip',
      domain: 'jpgflip.com'
    };
  }
  
  // Default to aviflip config
  return {
    siteName: 'AVIFlip',
    defaultConversionMode: 'avifToJpg',
    primaryColor: '#10b981', // Green
    secondaryColor: '#059669',
    accentColor: '#34d399',
    logoText: 'AVIFlip',
    domain: 'aviflip.com'
  };
}

// Export the current site configuration
export const siteConfig = getSiteConfig();