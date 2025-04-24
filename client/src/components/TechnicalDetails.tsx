const TechnicalDetails = () => {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy & Technical Details</h2>
      <div className="space-y-4 text-sm text-gray-500">
        <p><strong className="text-gray-700">100% Client-Side:</strong> Your files never leave your device. All processing happens in your browser.</p>
        <p><strong className="text-gray-700">How it works:</strong> AVIFlip uses WebAssembly to run FFmpeg directly in your browser, converting AVIF files to JPG format locally.</p>
        <p><strong className="text-gray-700">Performance:</strong> For optimal performance, we recommend using Chrome or Firefox with a reasonably fast device.</p>
        <p><strong className="text-gray-700">File Size:</strong> There's no hard limit, but browser memory constraints may affect very large files.</p>
      </div>
    </div>
  );
};

export default TechnicalDetails;
