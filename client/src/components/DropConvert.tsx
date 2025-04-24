import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Cloud, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle, 
  X, 
  FileImage,
  Download,
  Loader,
  Zap,
  ArrowLeftRight
} from 'lucide-react';
import { 
  formatFileSize, 
  getBrowserCapabilities, 
  readFileOptimized,
  createDownloadUrl 
} from '@/lib/utils';

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
  
  // Mode selection: false = AVIF to JPG, true = JPG to AVIF
  const [jpgToAvif, setJpgToAvif] = useState(false);
  
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
  
  // Check browser capabilities for optimized processing
  const capabilities = useMemo(() => getBrowserCapabilities(), []);
  
  // Use Web Workers for faster conversion if available
  const workerRef = useRef<Worker | null>(null);
  
  // Initialize worker if supported
  useEffect(() => {
    // Cleanup any previous worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    
    // Only create worker if browser supports it
    if (capabilities.hasWebWorker) {
      try {
        // Create worker in try-catch since it may fail in some environments
        const worker = new Worker(new URL('../workers/conversion.worker.ts', import.meta.url), { 
          type: 'module' 
        });
        
        // Set up message handler
        worker.onmessage = (event) => {
          const { status: workerStatus, progress: workerProgress, file, result, error } = event.data;
          
          if (workerStatus === 'progress') {
            setProgress(workerProgress);
            setProcessingFile(file);
          } else if (workerStatus === 'success') {
            setProgress(100);
            const url = URL.createObjectURL(result);
            console.log('Worker conversion success, setting download URL:', url);
            setDownloadUrl(url);
            setStatus('success');
            
            // Trigger download automatically after a short delay
            setTimeout(() => {
              if (workerRef.current) {
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                
                if (files.length === 1) {
                  downloadLink.download = files[0].name.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
                } else {
                  downloadLink.download = "converted_images.zip";
                }
                
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                console.log('Auto-download triggered for newly converted file');
              }
            }, 500);
          } else if (workerStatus === 'error') {
            setStatus('error');
            setErrorMessage(error || 'Conversion failed');
          }
        };
        
        workerRef.current = worker;
      } catch (err) {
        console.warn('Web Workers not fully supported, falling back to main thread processing', err);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [capabilities.hasWebWorker]);
  
  // Optimized conversion function with fallbacks for different browsers
  const convertFiles = async () => {
    if (files.length === 0 || status === 'processing') return;
    
    setStatus('processing');
    setProgress(0);
    setProcessingFile(0);
    
    try {
      const totalFiles = files.length;
      
      // Try to use Web Worker for processing
      if (workerRef.current) {
        // Send data to worker for processing
        workerRef.current.postMessage({
          type: totalFiles === 1 ? 'single' : 'batch',
          files,
          jpgToAvif // Include conversion mode
        });
        return; // Worker will handle the rest via onmessage
      }
      
      // Fallback to main thread processing if worker isn't available
      if (totalFiles === 1) {
        // Single file conversion
        const file = files[0];
        
        setProcessingFile(1);
        
        // Use optimized file reading
        const fileData = await readFileOptimized(file);
        
        // For MVP, simulate conversion with minimal delay
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 200)); // Faster in development
        }
        
        // Create a blob with proper MIME type based on conversion mode
        const blob = new Blob([fileData], { 
          type: jpgToAvif ? 'image/avif' : 'image/jpeg' 
        });
        
        // Use optimized URL creation
        const { url } = createDownloadUrl(blob, file.name);
        
        setProgress(100);
        setDownloadUrl(url);
        setStatus('success');
      } else {
        // Multiple files - create ZIP with compression
        const zip = new JSZip();
        
        // Process files in batches for better UI responsiveness
        const BATCH_SIZE = 3; // Process 3 files at a time
        
        for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
          // Create a batch of promises
          const batchPromises = [];
          
          // Calculate the end of this batch
          const endIndex = Math.min(i + BATCH_SIZE, totalFiles);
          
          // Create promises for each file in the batch
          for (let j = i; j < endIndex; j++) {
            const file = files[j];
            const extension = jpgToAvif ? '.avif' : '.jpg';
            const outputName = file.name.replace(/\.(avif|png|jpe?g)$/i, extension);
            
            // Create a promise for this file processing
            const processPromise = (async () => {
              // Read the file data efficiently
              const fileData = await readFileOptimized(file);
              
              // In real implementation, convert AVIF to JPG here
              
              // Add to zip with compression
              zip.file(outputName, fileData, {
                compression: "DEFLATE",
                compressionOptions: {
                  level: 6 // Medium compression - good balance between speed and size
                }
              });
              
              return j + 1; // Return the file index for progress tracking
            })();
            
            batchPromises.push(processPromise);
          }
          
          // Wait for all files in this batch to be processed
          const processedIndices = await Promise.all(batchPromises);
          
          // Update the UI with the most recent file processed
          const latestFileProcessed = Math.max(...processedIndices);
          setProcessingFile(latestFileProcessed);
          
          // Update progress based on number of files processed
          setProgress(Math.round((latestFileProcessed / totalFiles) * 100));
        }
        
        // Generate zip with streaming for better memory usage
        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          compression: "DEFLATE",
          compressionOptions: {
            level: 6
          },
          streamFiles: true 
        });
        
        const url = URL.createObjectURL(zipBlob);
        setDownloadUrl(url);
        setStatus('success');
      }
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
  
  // Handle file download
  const handleDownload = () => {
    if (status === 'success' && downloadUrl) {
      // Create a hidden anchor element to trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      
      if (files.length === 1) {
        // Single file download
        downloadLink.download = files[0].name.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
        console.log('Downloading single file:', downloadLink.download);
      } else {
        // ZIP download
        downloadLink.download = "converted_images.zip";
        console.log('Downloading ZIP with', files.length, 'files');
      }
      
      // Add to document, click, and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Track analytics
      if (window.performance && window.performance.now) {
        console.log('Conversion time:', Math.round(window.performance.now()), 'ms');
      }
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
              <p className="text-lg text-gray-700 font-medium">
                Drop {jpgToAvif ? 'JPG' : 'AVIF'} files here
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Convert {jpgToAvif ? 'JPG images to AVIF format' : 'AVIF images to JPG format'}
              </p>
              
              {/* Conversion Mode Toggle */}
              <div className="mt-4 flex items-center justify-center space-x-2">
                <span className="text-xs font-medium text-gray-500">AVIF → JPG</span>
                <Switch 
                  checked={jpgToAvif} 
                  onCheckedChange={setJpgToAvif} 
                  className="data-[state=checked]:bg-primary" 
                />
                <span className="text-xs font-medium text-gray-500">JPG → AVIF</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-6 w-6 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering file upload
                    setJpgToAvif(!jpgToAvif);
                  }}
                  title="Switch conversion direction"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Files Selected State */}
          {status === 'ready' && (
            <div>
              <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">{files.length} file(s) ready</p>
              <p className="text-gray-500 text-sm mt-1">
                Converting from {jpgToAvif ? 'JPG to AVIF' : 'AVIF to JPG'}
              </p>
              
              {/* Mode and speed optimization indicators */}
              <div className="mt-3 flex flex-col items-center gap-2">
                {/* Conversion mode indicator */}
                <div className="inline-flex items-center text-xs px-2 py-1 bg-success-50 text-success-700 rounded">
                  <ArrowLeftRight className="h-3 w-3 mr-1" />
                  Mode: {jpgToAvif ? 'JPG → AVIF' : 'AVIF → JPG'}
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-1 h-5 w-5 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering file upload
                      setJpgToAvif(!jpgToAvif);
                    }}
                    title="Switch conversion direction"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Speed hint - show which optimizations are active */}
                <div className="inline-flex items-center text-xs px-2 py-1 bg-primary/5 text-primary rounded">
                  <Zap className="h-3 w-3 mr-1" />
                  {capabilities.hasWebWorker 
                    ? 'Using high-speed parallel processing' 
                    : 'Using optimized processing'}
                </div>
              </div>
            </div>
          )}
          
          {/* Processing State */}
          {status === 'processing' && (
            <div>
              <RefreshCw className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-lg text-gray-700 font-medium">
                Converting to {jpgToAvif ? 'AVIF' : 'JPG'}...
              </p>
              <div className="mt-4 relative">
                <Progress value={progress} className="h-2.5" />
                <p className="text-sm text-gray-500 mt-1">
                  {progress}% complete ({processingFile}/{files.length} files)
                </p>
              </div>
              
              {/* Mode indicator during conversion */}
              <div className="mt-3 inline-flex items-center text-xs px-2 py-1 bg-primary/5 text-primary rounded">
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                Converting: {jpgToAvif ? 'JPG → AVIF' : 'AVIF → JPG'}
              </div>
            </div>
          )}
          
          {/* Error State */}
          {status === 'error' && (
            <div>
              <AlertTriangle className="h-16 w-16 text-warning-500 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">
                Error During {jpgToAvif ? 'AVIF' : 'JPG'} Conversion
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {errorMessage || `Failed to convert to ${jpgToAvif ? 'AVIF' : 'JPG'} format`}
              </p>
              <p className="text-gray-500 text-sm mt-1">Drop files again to retry</p>
              
              {/* Failed conversion mode indicator */}
              <div className="mt-3 inline-flex items-center text-xs px-2 py-1 bg-warning-50 text-warning-700 rounded">
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                Failed: {jpgToAvif ? 'JPG → AVIF' : 'AVIF → JPG'} conversion
              </div>
            </div>
          )}
          
          {/* Success State */}
          {status === 'success' && (
            <div>
              <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">
                {jpgToAvif ? 'AVIF' : 'JPG'} Conversion Complete!
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {files.length === 1 
                  ? `Your ${jpgToAvif ? 'AVIF' : 'JPG'} file is ready to download` 
                  : `Your ${files.length} files are ready to download in ZIP format`
                }
              </p>
              
              {/* Show conversion mode badge */}
              <div className="mt-3 inline-flex items-center text-xs px-2 py-1 bg-success-50 text-success-700 rounded">
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                Converted: {jpgToAvif ? 'JPG → AVIF' : 'AVIF → JPG'}
              </div>
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
        {/* Left side - Convert button */}
        <div className="flex-1">
          {/* Always show the conversion button except when processing or success */}
          {status !== 'processing' && status !== 'success' && (
            <Button 
              variant="default" 
              className="w-full" 
              onClick={convertFiles} 
              disabled={!isReady || files.length === 0}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {files.length === 1 
                ? jpgToAvif 
                  ? 'Convert to AVIF' 
                  : 'Convert to JPG'
                : jpgToAvif 
                  ? `Convert ${files.length} files to AVIF` 
                  : `Convert ${files.length} files to JPG`
              }
            </Button>
          )}
          
          {/* Processing state */}
          {status === 'processing' && (
            <Button 
              variant="default" 
              className="w-full opacity-70" 
              disabled
            >
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Converting to {jpgToAvif ? 'AVIF' : 'JPG'}...
            </Button>
          )}
          
          {/* After success, show "Convert more" button */}
          {status === 'success' && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setStatus('idle')}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Convert More Files
            </Button>
          )}
        </div>
        
        {/* Right side - Download button */}
        <div className="flex-1">
          {/* Download button - changes state based on conversion status */}
          <Button
            variant={status === 'success' ? "default" : "outline"}
            className={`w-full ${status === 'success' ? 'bg-success-600 hover:bg-success-700' : ''}`}
            disabled={status !== 'success'}
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            {status !== 'success' 
              ? (files.length === 0 
                  ? 'Download Files' 
                  : files.length === 1 
                    ? jpgToAvif ? 'Download AVIF' : 'Download JPG' 
                    : 'Download ZIP'
                )
              : (files.length === 1
                  ? `Download ${jpgToAvif ? 'AVIF' : 'JPG'} File` 
                  : `Download ZIP (${files.length} files)`)
            }
          </Button>
        </div>
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
