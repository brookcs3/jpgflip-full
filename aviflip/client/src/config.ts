/**
 * Site configuration
 * This file contains site-specific settings that change based on which
 * domain/brand is being displayed.
 */

// Define conversion mode type
export type ConversionMode = 'avifToJpg' | 'jpgToAvif';

// Define site configuration types
export interface SiteConfig {
  siteName: string;
  defaultConversionMode: ConversionMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoText: string;
  domain: string;
}

// Determine which configuration to use based on hostname
export function getSiteConfig(): SiteConfig {
  const hostname = window.location.hostname;
  
  // Log for debugging
  console.log('Current hostname:', hostname);
  
  // Production behavior - use jpgflip config when on jpgflip.com
  if (hostname.includes('jpgflip') || hostname.includes('jpgflip.com')) {
    const jpgFlipConfig: SiteConfig = {
      siteName: 'JPGFlip',
      defaultConversionMode: 'jpgToAvif',
      primaryColor: '#10b981', // Green (same as AVIFlip since you like the green)
      secondaryColor: '#059669',
      accentColor: '#34d399',
      logoText: 'JPGFlip',
      domain: 'jpgflip.com'
    };
    console.log('Running in JPGFlip mode with configuration:', jpgFlipConfig);
    return jpgFlipConfig;
  }
  
  // Default to aviflip config
  const aviFlipConfig: SiteConfig = {
    siteName: 'AVIFlip',
    defaultConversionMode: 'avifToJpg',
    primaryColor: '#10b981', // Green
    secondaryColor: '#059669',
    accentColor: '#34d399',
    logoText: 'AVIFlip',
    domain: 'aviflip.com'
  };
  console.log('Running in AVIFlip mode with configuration:', aviFlipConfig);
  return aviFlipConfig;
}

// Export the current site configuration
export const siteConfig = getSiteConfig();
