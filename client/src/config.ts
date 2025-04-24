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
  
  // TESTING: Temporarily force JPGFlip mode in dev environment - REMOVE after testing
  const forceTestMode = 'jpgflip'; // Use 'jpgflip' to test JPGFlip mode, 'aviflip' for AVIFlip mode, or null for normal behavior
  
  // Force test mode if specified and we're in development
  if (forceTestMode === 'jpgflip' && (window.location.port === '5000' || window.location.port === '5173')) {
    console.log('TESTING MODE: Forcing JPGFlip configuration for development');
    return {
      siteName: 'JPGFlip',
      defaultConversionMode: 'jpgToAvif',
      primaryColor: '#10b981', // Green (same as AVIFlip since you like the green)
      secondaryColor: '#059669',
      accentColor: '#34d399',
      logoText: 'JPGFlip',
      domain: 'jpgflip.com'
    };
  }
  
  // Production behavior - use jpgflip config when on jpgflip.com
  if (hostname.includes('jpgflip.com')) {
    return {
      siteName: 'JPGFlip',
      defaultConversionMode: 'jpgToAvif',
      primaryColor: '#10b981', // Green (same as AVIFlip since you like the green)
      secondaryColor: '#059669',
      accentColor: '#34d399',
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