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
  
  // Simple forced override for testing - add ?site=jpgflip to URL to force JPGFlip mode
  const urlParams = new URLSearchParams(window.location.search);
  const forceSite = urlParams.get('site');
  
  if (forceSite === 'jpgflip') {
    const jpgFlipConfig: SiteConfig = {
      siteName: 'JPGFlip',
      defaultConversionMode: 'jpgToAvif',
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      accentColor: '#34d399',
      logoText: 'JPGFlip',
      domain: 'jpgflip.com'
    };
    console.log('FORCED JPGFLIP MODE via URL parameter');
    return jpgFlipConfig;
  }
  
  // Very simple hostname check - exact match only to avoid confusion
  if (hostname === 'jpgflip.com' || hostname === 'www.jpgflip.com') {
    const jpgFlipConfig: SiteConfig = {
      siteName: 'JPGFlip',
      defaultConversionMode: 'jpgToAvif',
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      accentColor: '#34d399',
      logoText: 'JPGFlip',
      domain: 'jpgflip.com'
    };
    console.log('MATCHED JPGFLIP.COM DOMAIN EXACTLY');
    return jpgFlipConfig;
  }
  
  // Default to aviflip config for all other cases
  const aviFlipConfig: SiteConfig = {
    siteName: 'AVIFlip',
    defaultConversionMode: 'avifToJpg',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    accentColor: '#34d399',
    logoText: 'AVIFlip',
    domain: 'aviflip.com'
  };
  console.log('Using AVIFlip configuration (default)');
  return aviFlipConfig;
}

// Export the current site configuration
export const siteConfig = getSiteConfig();