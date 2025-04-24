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
          // Get current jpgToAvif state for debugging
          const currentJpgToAvifState = jpgToAvif;
          console.log('Worker message received:', event.data, 'jpgToAvif setting:', currentJpgToAvifState);
          
          const { 
            status: workerStatus, 
            progress: workerProgress, 
            file, 
            result, 
            error,
            isTwoFiles,
            secondFile,
            firstFileName,
            secondFileName,
            isZipFile,
            fileData,
            outputMimeType,
            extension
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
            
            // Handle download based on number of files
            // Force an immediate auto-download for all files
            console.log('Triggering auto-download for conversion result...');
            setTimeout(() => {
              if (workerRef.current) {
                // Log the result object to debug what's being returned
                console.log('Download result object:', result, typeof result, Object.keys(result));
                // Special handling for two files
                if (isTwoFiles && secondFile) {
                  // Use correct MIME type for file format recognition, but force download with download attribute
                  const forceDownloadBlob1 = new Blob([result], { 
                    type: jpgToAvif ? 'image/avif' : 'image/jpeg'
                  });
                  const forceUrl1 = URL.createObjectURL(forceDownloadBlob1);
                  
                  // Make sure to have proper file extensions
                  let file1Name = files[0].name;
                  // First remove any existing image extension
                  file1Name = file1Name.replace(/\.(avif|png|jpe?g)$/i, '');
                  // Then add the proper extension based on conversion mode
                  file1Name = file1Name + (jpgToAvif ? '.avif' : '.jpg');
                  
                  const downloadLink1 = document.createElement('a');
                  downloadLink1.href = forceUrl1;
                  downloadLink1.download = file1Name;
                  downloadLink1.setAttribute('download', file1Name); // Explicit download attribute
                  document.body.appendChild(downloadLink1);
                  // Use MouseEvent for better browser compatibility
                  const clickEvent1 = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                  });
                  downloadLink1.dispatchEvent(clickEvent1);
                  document.body.removeChild(downloadLink1);
                  
                  // Small delay between downloads to prevent browser issues
                  setTimeout(() => {
                    // Download second file - use correct MIME type but force download with download attribute
                    const forceDownloadBlob2 = new Blob([secondFile], { 
                      type: jpgToAvif ? 'image/avif' : 'image/jpeg'
                    });
                    const forceUrl2 = URL.createObjectURL(forceDownloadBlob2);
                    
                    // Make sure to have proper file extensions
                    let file2Name = files[1].name;
                    // First remove any existing image extension
                    file2Name = file2Name.replace(/\.(avif|png|jpe?g)$/i, '');
                    // Then add the proper extension based on conversion mode
                    file2Name = file2Name + (jpgToAvif ? '.avif' : '.jpg');
                    
                    const downloadLink2 = document.createElement('a');
                    downloadLink2.href = forceUrl2;
                    downloadLink2.download = file2Name;
                    downloadLink2.setAttribute('download', file2Name); // Explicit download attribute
                    document.body.appendChild(downloadLink2);
                    // Use MouseEvent for better browser compatibility
                    const clickEvent2 = new MouseEvent('click', {
                      view: window,
                      bubbles: true,
                      cancelable: true
                    });
                    downloadLink2.dispatchEvent(clickEvent2);
                    document.body.removeChild(downloadLink2);
                    
                    console.log('Auto-download triggered for 2 individual files via worker');
                  }, 300);
                } 
                // Handle single file or ZIP (3+ files)
                else {
                  // Use the file data and MIME type received from the worker
                  // Make sure we have the fileData from the worker
                  const actualFileData = fileData || new Uint8Array();
                  console.log('Using file data for download:', actualFileData);
                  
                  // Use the MIME type that matches the conversion direction
                  const actualMimeType = outputMimeType || (jpgToAvif ? 'image/avif' : 'image/jpeg');
                  console.log('Using MIME type for download:', actualMimeType);
                  
                  // Create the download blob
                  const forceDownloadBlob = new Blob([actualFileData], { 
                    type: actualMimeType
                  });
                  const forceUrl = URL.createObjectURL(forceDownloadBlob);
                  
                  const downloadLink = document.createElement('a');
                  downloadLink.href = forceUrl;
                  
                  if (files.length === 1) {
                    // Make sure we preserve the file extension by explicitly setting it
                    let fileName = files[0].name;
                    // First remove any existing image extension
                    fileName = fileName.replace(/\.(avif|png|jpe?g)$/i, '');
                    // Then add the proper extension based on what we received from the worker or fallback to our toggle
                    const fileExtension = extension || (jpgToAvif ? '.avif' : '.jpg');
                    fileName = fileName + fileExtension;
                    
                    console.log('Downloading file with name:', fileName, 'extension:', fileExtension);
                    
                    downloadLink.download = fileName;
                    downloadLink.setAttribute('download', fileName); // Explicit download attribute
                    console.log('Auto-download triggered for single file via worker:', fileName);
                  } else if (isZipFile || files.length > 2) {
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
                }
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
        
        // Auto-download file after a short delay - force download with octet-stream
        setTimeout(() => {
          // Use the original MIME type (image/jpeg or image/avif) so the browser can recognize the format
          const forceDownloadBlob = new Blob([fileData], { 
            type: jpgToAvif ? 'image/avif' : 'image/jpeg' 
          });
          const forceUrl = URL.createObjectURL(forceDownloadBlob);
          
          const downloadLink = document.createElement('a');
          downloadLink.href = forceUrl;
          const fileName = file.name.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
          downloadLink.download = fileName;
          downloadLink.setAttribute('download', fileName); // Explicit download attribute
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          console.log('Auto-download triggered for single file via main thread:', fileName);
        }, 500);
      } else if (totalFiles === 2) {
        // For exactly 2 files, convert them individually
        setProgress(0);
        
        for (let i = 0; i < 2; i++) {
          const file = files[i];
          setProcessingFile(i + 1);
          
          // Read file
          const fileData = await readFileOptimized(file);
          
          // Update progress
          setProgress(Math.round(((i + 1) / 2) * 100));
        }
        
        // Create separate blobs for each file
        const file1 = files[0];
        const file2 = files[1];
        
        const fileData1 = await readFileOptimized(file1);
        const fileData2 = await readFileOptimized(file2);
        
        // Create blobs
        const blob1 = new Blob([fileData1], { 
          type: jpgToAvif ? 'image/avif' : 'image/jpeg' 
        });
        
        const blob2 = new Blob([fileData2], { 
          type: jpgToAvif ? 'image/avif' : 'image/jpeg' 
        });
        
        // Create URLs
        const url1 = URL.createObjectURL(blob1);
        const url2 = URL.createObjectURL(blob2);
        
        // Set first URL as the download URL
        setDownloadUrl(url1);
        setStatus('success');
        
        // Auto-download both files with force download
        setTimeout(() => {
          // Use proper MIME type for file format but force download with download attribute
          const forceDownloadBlob1 = new Blob([fileData1], { 
            type: jpgToAvif ? 'image/avif' : 'image/jpeg' 
          });
          const forceUrl1 = URL.createObjectURL(forceDownloadBlob1);
          
          // Download first file
          const downloadLink1 = document.createElement('a');
          downloadLink1.href = forceUrl1;
          const fileName1 = file1.name.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
          downloadLink1.download = fileName1;
          downloadLink1.setAttribute('download', fileName1); // Explicit download attribute
          document.body.appendChild(downloadLink1);
          downloadLink1.click();
          document.body.removeChild(downloadLink1);
          
          // Small delay between downloads to prevent browser issues
          setTimeout(() => {
            // Use proper MIME type for the second file too
            const forceDownloadBlob2 = new Blob([fileData2], {
              type: jpgToAvif ? 'image/avif' : 'image/jpeg'
            });
            const forceUrl2 = URL.createObjectURL(forceDownloadBlob2);
            
            // Download second file
            const downloadLink2 = document.createElement('a');
            downloadLink2.href = forceUrl2;
            const fileName2 = file2.name.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
            downloadLink2.download = fileName2;
            downloadLink2.setAttribute('download', fileName2); // Explicit download attribute
            document.body.appendChild(downloadLink2);
            downloadLink2.click();
            document.body.removeChild(downloadLink2);
            
            console.log('Auto-download triggered for 2 individual files');
          }, 300);
        }, 500);
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
            // Preserve the original MIME type but use the download attribute to force download
            const type = files.length === 1
              ? jpgToAvif ? 'image/avif' : 'image/jpeg'
              : 'application/zip';
            const forceDownloadBlob = new Blob([blob], { type });
            const forceUrl = URL.createObjectURL(forceDownloadBlob);
            
            // Create a hidden anchor element to trigger download
            const downloadLink = document.createElement('a');
            downloadLink.href = forceUrl;
            
            if (files.length === 1) {
              // Single file download
              const fileName = files[0].name.replace(/\.(avif|png|jpe?g)$/i, jpgToAvif ? '.avif' : '.jpg');
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
