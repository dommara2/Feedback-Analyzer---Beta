import React from 'react';
import { FileText } from 'lucide-react';

interface AnalysisResultsProps {
  analysis: string;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis }) => {
  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
        <FileText className="mr-2" />
        Analysis Results
      </h3>
      <pre className="whitespace-pre-wrap text-gray-700 font-mono text-sm">
        {analysis}
      </pre>
    </div>
  );
};

export default AnalysisResults;