// Conversion worker for image processing
import JSZip from 'jszip';

// Process files in a web worker
self.onmessage = async (event) => {
  const { files, type, jpgToAvif } = event.data;
  
  console.log('Worker received message:', { type, jpgToAvif, fileCount: files.length });
  
  try {
    // Set up the correct MIME type and extension based on conversion direction
    const outputMimeType = jpgToAvif ? 'image/avif' : 'image/jpeg';
    const fileExtensionRegex = /\.(avif|png|jpe?g)$/i;
    const outputExtension = jpgToAvif ? '.avif' : '.jpg';
    
    if (type === 'single') {
      // Single file processing
      const file = files[0];
      const fileData = await readFileAsArrayBuffer(file);
      
      // Log the file data length to confirm we have actual data
      console.log(`Worker processing single file: ${file.name}, size: ${fileData.byteLength} bytes`);
      
      // Create blob with the appropriate MIME type based on conversion direction
      const resultBlob = new Blob([fileData], { type: outputMimeType });
      
      // Verify the blob has content
      console.log(`Created result blob of size: ${resultBlob.size} bytes`);
      
      // Post back the result with the original filename and proper extension
      // Remove existing extension and add the new one
      const originalName = file.name.replace(fileExtensionRegex, '');
      
      self.postMessage({
        status: 'success', 
        result: resultBlob,
        outputMimeType, // Send mime type information
        extension: outputExtension, // Send extension info
        originalFileName: originalName, // Send original name for proper naming
        type: 'single', // Explicitly mark as single file
        isZipFile: false, // Explicitly mark as NOT zip file
        progress: 100
      });
      
    } else if (type === 'batch') {
      // If we somehow got a "batch" request for a single file, process it as single instead
      if (files.length === 1) {
        console.log('Received batch request for single file - converting to single file mode');
        // Re-use the single-file code path
        const file = files[0];
        const fileData = await readFileAsArrayBuffer(file);
        console.log(`Processing single file in batch mode: ${file.name}, size: ${fileData.byteLength} bytes`);
        
        const resultBlob = new Blob([fileData], { type: outputMimeType });
        const originalName = file.name.replace(fileExtensionRegex, '');
        
        self.postMessage({
          status: 'success',
          result: resultBlob,
          outputMimeType,
          extension: outputExtension,
          originalFileName: originalName,
          type: 'single',
          isZipFile: false,
          progress: 100
        });
        return;
      }
      
      // Batch processing with ZIP creation for multiple files (actual multiple files, 2+)
      console.log(`Worker processing batch of ${files.length} files`);
      
      const zip = new JSZip();
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        // Use the appropriate file extension based on conversion direction
        const outputName = file.name.replace(fileExtensionRegex, outputExtension);
        
        // Read file data
        const fileData = await readFileAsArrayBuffer(file);
        console.log(`Processing file ${i+1}/${totalFiles}: ${file.name}, size: ${fileData.byteLength} bytes`);
        
        // In real implementation, convert between formats here
        // For now, just add to zip with the new extension
        zip.file(outputName, fileData);
        
        // Report progress
        self.postMessage({
          status: 'progress',
          file: i + 1,
          progress: Math.round(((i + 1) / totalFiles) * 100)
        });
      }
      
      // Generate zip with compression
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6 // Medium compression, good balance of speed vs size
        },
        streamFiles: true
      });
      
      console.log(`Generated ZIP blob of size: ${zipBlob.size} bytes for ${files.length} files. Using conversion direction: ${jpgToAvif ? 'JPG → AVIF' : 'AVIF → JPG'}`);
      
      // Always set the correct MIME type for ZIP files
      self.postMessage({
        status: 'success',
        result: zipBlob,
        isZipFile: true,
        outputMimeType: 'application/zip', // Explicit ZIP MIME type
        progress: 100
      });
    }
  } catch (error: any) {
    console.error('Worker error:', error);
    self.postMessage({
      status: 'error',
      error: error.message || 'Conversion failed'
    });
  }
};

// Helper function to read file as ArrayBuffer
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsArrayBuffer(file);
  });
}

export {};