import React, { useState, useEffect } from 'react';
import { siteConfig } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DebugInfo = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [siteMode, setSiteMode] = useState<string>('');
  const [modeReason, setModeReason] = useState<string>('');
  
  const hostname = window.location.hostname.toLowerCase();
  const protocol = window.location.protocol;
  const fullUrl = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const forceSite = urlParams.get('site')?.toLowerCase();

  useEffect(() => {
    // Determine site mode based on URL and hostname
    if (forceSite === 'jpgflip') {
      setSiteMode('JPGFlip');
      setModeReason('URL parameter override');
    } else if (forceSite === 'aviflip') {
      setSiteMode('AVIFlip');
      setModeReason('URL parameter override');
    } else if (hostname === 'jpgflip.com' || hostname === 'www.jpgflip.com') {
      setSiteMode('JPGFlip');
      setModeReason('Hostname match');
    } else if (hostname === 'aviflip.com' || hostname === 'www.aviflip.com') {
      setSiteMode('AVIFlip');
      setModeReason('Hostname match');
    } else {
      setSiteMode('AVIFlip');
      setModeReason('Default fallback');
    }
  }, [hostname, forceSite]);

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDebug(true)}
          className="opacity-50 hover:opacity-100"
        >
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[90vw]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Debug Information</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDebug(false)}
            >
              Close
            </Button>
          </CardTitle>
          <CardDescription>Domain and configuration data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <strong>Current Mode:</strong> 
              <Badge variant={siteMode === 'JPGFlip' ? 'outline' : 'default'}>
                {siteMode}
              </Badge>
              <span className="text-xs text-muted-foreground">({modeReason})</span>
            </div>
            
            <div className="p-2 bg-muted rounded-md mb-2">
              <div className="font-medium mb-1">URL Parameters:</div>
              <div><strong>site=</strong> {forceSite || 'Not set'}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Add ?site=jpgflip or ?site=aviflip to force a mode
              </div>
            </div>
            
            <div>
              <strong>Hostname:</strong> {hostname}
            </div>
            <div>
              <strong>Protocol:</strong> {protocol}
            </div>
            <div>
              <strong>Full URL:</strong> {fullUrl}
            </div>
            <div>
              <strong>Site Name:</strong> {siteConfig.siteName}
            </div>
            <div>
              <strong>Default Mode:</strong> {siteConfig.defaultConversionMode}
            </div>
            <div>
              <strong>Domain:</strong> {siteConfig.domain}
            </div>
            <div>
              <strong>Document Referrer:</strong> {document.referrer || 'None'}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-gray-500">
          This debug panel is for development purposes only.
        </CardFooter>
      </Card>
    </div>
  );
};

export default DebugInfo;