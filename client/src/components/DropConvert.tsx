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
  const [fileCount, setFileCount] = useState<number>(0); // Store file count for later reference
  
  // Mode selection: false = AVIF to JPG, true = JPG to AVIF
  const [jpgToAvif, setJpgToAvif] = useState(false);
  
  // Update the page title when conversion mode changes
  useEffect(() => {
    document.title = jpgToAvif 
      ? "AVIFlip - Convert JPG to AVIF in your browser"
      : "AVIFlip - Convert AVIF to JPG in your browser";
  }, [jpgToAvif]);
  
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
    
    // Always set status to 'ready' instead of auto-processing when files are added
    setFiles(avifFiles);
    setStatus('ready'); // This ensures the user needs to click convert
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
          // Get current jpgToAvif state for debugging
          const currentJpgToAvifState = jpgToAvif;
          console.log('Worker message received:', event.data, 'jpgToAvif setting:', currentJpgToAvifState);
          
          const { 
            status: workerStatus, 
            progress: workerProgress, 
            file, 
            result, 
            error,
            isZipFile,
            outputMimeType,
            extension,
            originalFileName,
            type: messageType,
            // CRITICAL: Read these properties from the worker
            // The worker has the correct information about single vs multiple files
            fileCount: workerFileCount,
            isSingleFile: workerIsSingleFile,
            isMultiFile: workerIsMultiFile
          } = event.data;
          
          if (workerStatus === 'progress') {
            setProgress(workerProgress);
            setProcessingFile(file);
          } else if (workerStatus === 'success') {
            setProgress(100);
            const url = URL.createObjectURL(result);
            console.log('Worker conversion success, setting download URL:', url);
            setDownloadUrl(url);
            setStatus('success');
            
            // CRITICAL: Store the original file count in a local variable
            // that will be accessible in the setTimeout scope
            const originalFiles = [...files];
            const originalCount = originalFiles.length;
            console.log('Storing file count in closure for download:', originalCount);
            
            // Handle download based on number of files
            console.log('Triggering auto-download for conversion result...');
            setTimeout(() => {
              if (result instanceof Blob) {
                // Log the result object and file information
                console.log('Download result object:', result);
                console.log('Worker result blob size:', result.size, 'bytes, type:', result.type);
                
                // Make download MIME type decision based on file count and conversion type
                // Default to octet-stream to force download in all browsers
                let downloadMimeType = 'application/octet-stream';
                
                // Use ZIP MIME type for multiple files
                if (files.length > 1) {
                  downloadMimeType = 'application/zip';
                  console.log('Using ZIP MIME type for multiple files:', files.length);
                } else {
                  console.log('Using force-download MIME type for single file');
                }
                
                // Create a new blob with the download MIME type
                const forceDownloadBlob = new Blob([result], { type: downloadMimeType });
                const forceUrl = URL.createObjectURL(forceDownloadBlob);
                
                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = forceUrl;
                
                // Use our closure-captured originalCount from when the success handler ran
                // This is more reliable than depending on React state or the files array
                // CRITICAL: This is the safe way to determine download format
                
                console.log('Captured original count in closure:', originalCount);
                console.log('Current file count in state:', fileCount);
                console.log('Current files array length:', files.length);
                
                // FINAL DECISION LOGIC:
                // 1. Use worker's isZipFile flag as our primary indicator (most reliable)
                // 2. Fall back to worker's file count
                // 3. Fall back to our closure variable (less reliable but better than files.length)
                // 4. Last resort: fall back to fileCount state
                
                // First check if worker is explicitly marking this as a ZIP file
                let shouldUseZip = isZipFile === true;
                
                // If worker didn't specify, use worker's file count or flags
                if (shouldUseZip === undefined) {
                  if (workerIsMultiFile === true) {
                    shouldUseZip = true;
                  } else if (workerIsSingleFile === true) {
                    shouldUseZip = false;
                  } else if (workerFileCount && workerFileCount > 1) {
                    shouldUseZip = true;
                  } else if (workerFileCount === 1) {
                    shouldUseZip = false;
                  }
                }
                
                // If still undefined, use our local tracking
                if (shouldUseZip === undefined) {
                  shouldUseZip = originalCount > 1;
                }
                
                // For debugging
                console.log('Download decision:', {
                  shouldUseZip,
                  isZipFile,
                  workerFileCount,
                  workerIsSingleFile,
                  workerIsMultiFile,
                  originalCount,
                  currentFileCount: fileCount
                });
                
                const actualFileCount = shouldUseZip ? 2 : 1; // Force correct path selection
                
                // FORCE single file paths for count===1 and ZIP for count>1
                // This ensures consistent download behavior
                if (actualFileCount === 1) {
                  // SINGLE FILE - always direct download with proper extension
                  // Make sure we preserve the file extension by explicitly setting it
                  // Use the originalFileName from the worker if available, otherwise generate it from the file
                  let baseFileName = originalFileName || 
                                    (files[0] ? files[0].name.replace(/\.(avif|png|jpe?g)$/i, '') : 'converted-file');
                  
                  // Then add the proper extension based on what we received from the worker
                  const fileExtension = extension || (jpgToAvif ? '.avif' : '.jpg');
                  const fileName = baseFileName + fileExtension;
                  
                  console.log('Downloading file with name:', fileName, 'extension:', fileExtension);
                  
                  downloadLink.download = fileName;
                  downloadLink.setAttribute('download', fileName); // Explicit download attribute
                  console.log('Auto-download triggered for single file via worker:', fileName);
                } else {
                  // ZIP download for batch processing
                  downloadLink.download = "converted_images.zip";
                  downloadLink.setAttribute('download', "converted_images.zip"); // Explicit download attribute
                  console.log('Auto-download triggered for ZIP with', files.length, 'files via worker');
                }
                
                // Force the download by using appropriate techniques for different browsers
                document.body.appendChild(downloadLink);
                
                // Create mouse event to trigger the click (more compatible with some browsers)
                const clickEvent = new MouseEvent('click', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                });
                downloadLink.dispatchEvent(clickEvent);
                
                // Clean up
                setTimeout(() => document.body.removeChild(downloadLink), 100);
              } else {
                console.error('Worker did not return a valid Blob:', result);
                setStatus('error');
                setErrorMessage('Conversion failed - invalid result');
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
  }, [capabilities.hasWebWorker, jpgToAvif]); // Add jpgToAvif to the dependency array so the worker updates when it changes
  
  // Optimized conversion function with fallbacks for different browsers
  const convertFiles = async () => {
    if (files.length === 0 || status === 'processing') return;
    
    // IMPORTANT: Save the file count immediately when we start conversion
    // This ensures we maintain the correct count throughout the entire process
    const totalFiles = files.length;
    setFileCount(totalFiles);
    
    setStatus('processing');
    setProgress(0);
    setProcessingFile(0);
    
    try {
      
      console.log('Starting conversion with settings:', {
        fileCount: totalFiles,
        isSingleFile: totalFiles === 1,
        conversionMode: jpgToAvif ? 'JPG to AVIF' : 'AVIF to JPG'
      });
      
      // Try to use Web Worker for processing
      if (workerRef.current) {
        // Always use correct type based on file count 
        // Single file = direct download, multiple files = ZIP
        const processingType = totalFiles === 1 ? 'single' : 'batch';
        
        console.log(`Sending ${processingType} processing request to worker for ${totalFiles} file(s)`);
        
        // Send data to worker for processing
        // CRITICAL: Pass the totalFiles value to the worker as we know it's accurate at this point
        workerRef.current.postMessage({
          type: processingType,
          files,
          jpgToAvif, // Include conversion mode
          totalFiles, // Pass the actual file count to ensure worker has it
          isSingleFile: totalFiles === 1
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
        
        // Auto-download file after a short delay - force download with octet-stream
        setTimeout(() => {
          // Use application/octet-stream MIME type to force browser download behavior
          const forceDownloadBlob = new Blob([fileData], { 
            type: 'application/octet-stream'
          });
          const forceUrl = URL.createObjectURL(forceDownloadBlob);
          
          const downloadLink = document.createElement('a');
          downloadLink.href = forceUrl;
          // Make sure file exists and has a name property
          const safeFileName = file && file.name ? file.name : 'converted-file';
          const fileName = safeFileName.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
          downloadLink.download = fileName;
          downloadLink.setAttribute('download', fileName); // Explicit download attribute
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          console.log('Auto-download triggered for single file via main thread:', fileName);
        }, 500);
      } else {
        // Multiple files - create ZIP with compression (for all files > 1)
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
        
        // Auto-download ZIP file after a short delay - force download
        setTimeout(() => {
          // ZIP files have application/zip MIME type which is already a download type,
          // so we keep it as is with the download attribute to ensure it works properly
          const forceDownloadBlob = new Blob([zipBlob], { type: 'application/zip' });
          const forceUrl = URL.createObjectURL(forceDownloadBlob);
          
          const downloadLink = document.createElement('a');
          downloadLink.href = forceUrl;
          downloadLink.download = "converted_images.zip";
          downloadLink.setAttribute('download', "converted_images.zip"); // Explicit download attribute
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          console.log('Auto-download triggered for ZIP with', files.length, 'files');
        }, 500);
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
  
  // Handle file download - uses application/octet-stream to force download
  const handleDownload = () => {
    if (status === 'success' && downloadUrl) {
      try {
        // Get the blob from the URL
        fetch(downloadUrl)
          .then(res => res.blob())
          .then(blob => {
            // Use application/octet-stream MIME type to force browser download behavior
            // except for ZIP files which need application/zip MIME type
            // Files > 1 (2+ files) should be zipped
            const type = files.length > 1
              ? 'application/zip'
              : 'application/octet-stream';
            const forceDownloadBlob = new Blob([blob], { type });
            const forceUrl = URL.createObjectURL(forceDownloadBlob);
            
            // Create a hidden anchor element to trigger download
            const downloadLink = document.createElement('a');
            downloadLink.href = forceUrl;
            
            if (files.length === 1) {
              // Single file download - safely handle file name
              const safeFileName = files[0] && files[0].name 
                ? files[0].name 
                : 'converted-file';
              const fileName = safeFileName.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
              downloadLink.download = fileName;
              downloadLink.setAttribute('download', fileName); // Explicit download attribute
              console.log('Downloading single file:', fileName);
            } else {
              // ZIP download
              downloadLink.download = "converted_images.zip";
              downloadLink.setAttribute('download', "converted_images.zip"); // Explicit download attribute
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
          });
      } catch (error) {
        console.error('Error during manual download:', error);
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
      <div className="px-6 py-4 bg-gray-50">
        {/* Conversion Button - Full Width */}
        <div className="w-full">
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
            <div className="relative w-full">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setStatus('idle')}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Convert More Files
              </Button>
              <div className="absolute top-full left-0 right-0 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded text-center">
                Your file{files.length > 1 ? 's are' : ' is'} downloading automatically
              </div>
            </div>
          )}
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 text-gray-400 hover:text-gray-800" 
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DropConvert;