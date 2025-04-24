import { Upload, RefreshCw, Download } from "lucide-react";

const HowItWorks = () => {
  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-4">How It Works</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary/20 hover:bg-gray-50/80 transition-colors duration-200">
          <div className="bg-primary/10 p-2.5 rounded-md">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-800">1. Drop Files</h3>
            <p className="text-xs text-gray-500 mt-1">
              Drop your image files into the converter
            </p>
          </div>
        </div>
        
        {/* Step 2 */}
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary/20 hover:bg-gray-50/80 transition-colors duration-200">
          <div className="bg-primary/10 p-2.5 rounded-md">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-800">2. Convert</h3>
            <p className="text-xs text-gray-500 mt-1">
              Process entirely in your browser
            </p>
          </div>
        </div>
        
        {/* Step 3 */}
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary/20 hover:bg-gray-50/80 transition-colors duration-200">
          <div className="bg-primary/10 p-2.5 rounded-md">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-800">3. Download</h3>
            <p className="text-xs text-gray-500 mt-1">
              Get your JPGs individually or as a ZIP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
