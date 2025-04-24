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
  const fullUrl = window.location.href;
  const locationPath = window.location.pathname;
  
  // Enhanced logging for debugging
  console.log('Site configuration debug info:');
  console.log('- Current hostname:', hostname);
  console.log('- Full URL:', fullUrl);
  console.log('- Path:', locationPath);
  console.log('- Contains jpgflip?', hostname.includes('jpgflip'));
  
  // Production behavior - use jpgflip config when on jpgflip.com
  // Improve detection to be more specific and robust
  if (
    hostname === 'jpgflip.com' || 
    hostname === 'www.jpgflip.com' || 
    hostname.includes('jpgflip.pages.dev') || 
    hostname.includes('jpgflip')
  ) {
    const jpgFlipConfig: SiteConfig = {
      siteName: 'JPGFlip',
      defaultConversionMode: 'jpgToAvif',
      primaryColor: '#10b981', // Green (same as AVIFlip since you like the green)
      secondaryColor: '#059669',
      accentColor: '#34d399',
      logoText: 'JPGFlip',
      domain: 'jpgflip.com'
    };
    console.log('DETECTED JPGFLIP DOMAIN - Running in JPGFlip mode with configuration:', jpgFlipConfig);
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
  console.log('Using default AVIFlip mode with configuration:', aviFlipConfig);
  return aviFlipConfig;
}

// Export the current site configuration
export const siteConfig = getSiteConfig();