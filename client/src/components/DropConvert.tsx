import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Cloud, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle, 
  X, 
  FileImage,
  Download,
  Loader
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

// Type for our accepted files
interface AcceptedFile extends File {
  path?: string;
}

const DropConvert = () => {
  const [isReady, setIsReady] = useState(true); // For MVP, set this to true directly
  const [files, setFiles] = useState<AcceptedFile[]>([]);
  const [status, setStatus] = useState<'idle' | 'ready' | 'processing' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [processingFile, setProcessingFile] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset state if we had a download before
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    
    const avifFiles = acceptedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.avif') || 
      file.name.toLowerCase().endsWith('.png') || 
      file.name.toLowerCase().endsWith('.jpg') || 
      file.name.toLowerCase().endsWith('.jpeg')
    );
    
    if (avifFiles.length === 0) {
      setStatus('error');
      setErrorMessage('Please select image files (AVIF, PNG, JPG)');
      return;
    }
    
    setFiles(avifFiles);
    setStatus('ready');
    setProgress(0);
  }, [downloadUrl]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/avif': ['.avif'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
  });
  
  // Simulate conversion for the MVP
  const convertFiles = async () => {
    if (files.length === 0 || status === 'processing') return;
    
    setStatus('processing');
    setProgress(0);
    setProcessingFile(0);
    
    try {
      const zip = new JSZip();
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const outputName = file.name.replace('.avif', '.jpg');
        
        setProcessingFile(i + 1);
        
        // For MVP, just read the file and add it to the zip
        const fileData = await file.arrayBuffer();
        zip.file(outputName, fileData);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update progress
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
      
      // Generate zip
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        streamFiles: true 
      });
      
      const url = URL.createObjectURL(zipBlob);
      setDownloadUrl(url);
      setStatus('success');
    } catch (error: any) {
      console.error('Conversion error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Conversion failed');
    }
  };
  
  // Remove a file from the list
  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    if (files.length <= 1) {
      setStatus('idle');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
      {/* File Drop Zone */}
      <div className="p-6 border-b border-gray-200">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/70 hover:bg-primary/5'
          }`}
        >
          <input {...getInputProps()} />
          
          {/* Initial State */}
          {status === 'idle' && (
            <div>
              <Cloud className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">Drop image files here</p>
              <p className="text-gray-500 text-sm mt-1">Supports AVIF, PNG, JPG formats</p>
            </div>
          )}
          
          {/* Files Selected State */}
          {status === 'ready' && (
            <div>
              <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">{files.length} file(s) ready</p>
              <p className="text-gray-500 text-sm mt-1">Click convert button to process</p>
            </div>
          )}
          
          {/* Processing State */}
          {status === 'processing' && (
            <div>
              <RefreshCw className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-lg text-gray-700 font-medium">Converting...</p>
              <div className="mt-4 relative">
                <Progress value={progress} className="h-2.5" />
                <p className="text-sm text-gray-500 mt-1">
                  {progress}% complete ({processingFile}/{files.length} files)
                </p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {status === 'error' && (
            <div>
              <AlertTriangle className="h-16 w-16 text-warning-500 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">Error: {errorMessage}</p>
              <p className="text-gray-500 text-sm mt-1">Drop files again to retry</p>
            </div>
          )}
          
          {/* Success State */}
          {status === 'success' && (
            <div>
              <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">Conversion complete!</p>
              <p className="text-gray-500 text-sm mt-1">Click the download button below</p>
            </div>
          )}
        </div>
        
        {/* Cross-Origin Warning */}
        {!window.crossOriginIsolated && (
          <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded text-warning-700 text-sm">
            <AlertTriangle className="inline-block h-4 w-4 mr-1" />
            Warning: Cross-Origin Isolation not enabled. Performance may be limited.
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row gap-3">
        {status !== 'processing' && status !== 'success' && (
          <Button 
            variant="default" 
            className="flex-1" 
            onClick={convertFiles} 
            disabled={!isReady || files.length === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Convert to JPG
          </Button>
        )}
        
        {status === 'processing' && (
          <Button 
            variant="default" 
            className="flex-1 opacity-70" 
            disabled
          >
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Converting...
          </Button>
        )}
        
        {status === 'success' && downloadUrl && (
          <Button
            variant="default"
            className="flex-1 bg-success-600 hover:bg-success-700"
            asChild
          >
            <a href={downloadUrl} download="converted_images.zip">
              <Download className="mr-2 h-4 w-4" />
              Download ZIP
            </a>
          </Button>
        )}
      </div>
      
      {/* File List */}
      {files.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h3>
          <ul className="divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={index} className="py-3 flex justify-between items-center">
                <div className="flex items-center">
                  <FileImage className="text-gray-400 mr-3 h-4 w-4" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">({formatFileSize(file.size)})</span>
                </div>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DropConvert;
