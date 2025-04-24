import { Upload, RefreshCw, Download } from "lucide-react";
import StepCard from "./StepCard";

const HowItWorks = () => {
  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-3">How It Works</h2>
      <div className="flex flex-row overflow-x-auto pb-2">
        <div className="flex flex-nowrap space-x-4">
          <div className="w-60 flex-shrink-0">
            <StepCard 
              icon={Upload}
              title="1. Drop Files"
              description="Drop your image files into the converter"
            />
          </div>
          <div className="w-60 flex-shrink-0">
            <StepCard 
              icon={RefreshCw}
              title="2. Convert"
              description="Process entirely in your browser"
            />
          </div>
          <div className="w-60 flex-shrink-0">
            <StepCard 
              icon={Download}
              title="3. Download"
              description="Get your JPGs individually or as a ZIP"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
