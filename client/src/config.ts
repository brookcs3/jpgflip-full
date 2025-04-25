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

// Configuration for JPGFlip
const jpgFlipConfig: SiteConfig = {
  siteName: 'JPGFlip',
  defaultConversionMode: 'jpgToAvif',
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  accentColor: '#34d399',
  logoText: 'JPGFlip',
  domain: 'jpgflip.com'
};

// Configuration for AVIFlip
const aviFlipConfig: SiteConfig = {
  siteName: 'AVIFlip',
  defaultConversionMode: 'avifToJpg',
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  accentColor: '#34d399',
  logoText: 'AVIFlip',
  domain: 'aviflip.com'
};

// Determine which configuration to use based on hostname and URL parameters
export function getSiteConfig(): SiteConfig {
  // First check URL parameter (?site=jpgflip or ?site=aviflip)
  const urlParams = new URLSearchParams(window.location.search);
  const forceSite = urlParams.get('site')?.toLowerCase();
  
  if (forceSite === 'jpgflip') {
    console.log('USING JPGFLIP CONFIG: URL parameter override');
    return jpgFlipConfig;
  }
  
  if (forceSite === 'aviflip') {
    console.log('USING AVIFLIP CONFIG: URL parameter override');
    return aviFlipConfig;
  }
  
  // Then check hostname exactly
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname === 'jpgflip.com' || hostname === 'www.jpgflip.com') {
    console.log('USING JPGFLIP CONFIG: Hostname match');
    return jpgFlipConfig;
  }
  
  if (hostname === 'aviflip.com' || hostname === 'www.aviflip.com') {
    console.log('USING AVIFLIP CONFIG: Hostname match');
    return aviFlipConfig;
  }
  
  // Default to aviflip config for all other cases
  console.log('USING AVIFLIP CONFIG: Default fallback');
  return aviFlipConfig;
}

// Export the current site configuration
export const siteConfig = getSiteConfig();