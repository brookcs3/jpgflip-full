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
  primaryColor: '#10b981',     // Green-500
  secondaryColor: '#059669',   // Green-600
  accentColor: '#34d399',      // Green-400
  logoText: 'JPGFlip',
  domain: 'jpgflip.com'
};

// Configuration for AVIFlip
const aviFlipConfig: SiteConfig = {
  siteName: 'AVIFlip',
  defaultConversionMode: 'avifToJpg',
  primaryColor: '#3b82f6',    // Blue-500
  secondaryColor: '#2563eb',  // Blue-600
  accentColor: '#60a5fa',     // Blue-400
  logoText: 'AVIFlip',
  domain: 'aviflip.com'
};

// Determine which configuration to use based on hostname and URL parameters
export function getSiteConfig(): SiteConfig {
  // First check URL parameter (any of ?site=jpgflip or ?jpgflip or ?mode=jpgflip)
  const urlParams = new URLSearchParams(window.location.search);
  const forceSite = urlParams.get('site')?.toLowerCase();
  
  // Check for site parameter
  if (forceSite === 'jpgflip') {
    console.log('USING JPGFLIP CONFIG: URL site parameter override');
    return jpgFlipConfig;
  }
  
  if (forceSite === 'aviflip') {
    console.log('USING AVIFLIP CONFIG: URL site parameter override');
    return aviFlipConfig;
  }
  
  // Check for direct parameter (no value needed)
  if (urlParams.has('jpgflip')) {
    console.log('USING JPGFLIP CONFIG: Direct URL parameter override');
    return jpgFlipConfig;
  }
  
  // Check for mode parameter
  const mode = urlParams.get('mode')?.toLowerCase();
  if (mode === 'jpgflip') {
    console.log('USING JPGFLIP CONFIG: URL mode parameter override');
    return jpgFlipConfig;
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
  
  // For JPGFlip repository, default to JPGFlip
  console.log('USING JPGFLIP CONFIG: Default fallback for JPGFlip repository');
  return jpgFlipConfig;
}

// Export the current site configuration
export const siteConfig = getSiteConfig();
