// Conversion worker for image processing
import JSZip from 'jszip';

// Process files in a web worker
self.onmessage = async (event) => {
  const { files, type, jpgToAvif } = event.data;
  
  try {
    // Set up the correct MIME type and extension based on conversion direction
    const outputMimeType = jpgToAvif ? 'image/avif' : 'image/jpeg';
    const fileExtensionRegex = /\.(avif|png|jpe?g)$/i;
    const outputExtension = jpgToAvif ? '.avif' : '.jpg';
    
    if (type === 'single') {
      // Single file processing
      const file = files[0];
      const fileData = await readFileAsArrayBuffer(file);
      
      // Create blob with the appropriate MIME type based on conversion direction
      const resultBlob = new Blob([fileData], { type: outputMimeType });
      
      // Post back the result
      self.postMessage({
        status: 'success', 
        result: resultBlob,
        progress: 100
      });
      
    } else if (type === 'batch') {
      // Batch processing with ZIP creation
      const zip = new JSZip();
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        // Use the appropriate file extension based on conversion direction
        const outputName = file.name.replace(fileExtensionRegex, outputExtension);
        
        // Read file data
        const fileData = await readFileAsArrayBuffer(file);
        
        // In real implementation, convert between formats here
        // For now, just add to zip
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
      
      self.postMessage({
        status: 'success',
        result: zipBlob,
        progress: 100
      });
    }
  } catch (error: any) {
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