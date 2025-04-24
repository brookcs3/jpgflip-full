import React, { useState } from 'react';
import { siteConfig } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const DebugInfo = () => {
  const [showDebug, setShowDebug] = useState(false);
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const fullUrl = window.location.href;

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
              <strong>Hostname contains 'jpgflip':</strong> {hostname.includes('jpgflip') ? 'Yes' : 'No'}
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