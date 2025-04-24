import { Upload, RefreshCw, Download } from "lucide-react";
import StepCard from "./StepCard";

const HowItWorks = () => {
  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StepCard 
          icon={Upload}
          title="1. Drop Files"
          description="Drop your AVIF files into the converter"
        />
        <StepCard 
          icon={RefreshCw}
          title="2. Convert"
          description="Process entirely in your browser"
        />
        <StepCard 
          icon={Download}
          title="3. Download"
          description="Get your JPGs as a ZIP archive"
        />
      </div>
    </div>
  );
};

export default HowItWorks;
