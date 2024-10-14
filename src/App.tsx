import React, { useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import FileUpload from './components/FileUpload';
import AnalysisResults from './components/AnalysisResults';

function App() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnalysis(result.analysis);
    } catch (error) {
      console.error('Error during analysis:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-blue-500 text-white p-6">
        <h1 className="text-3xl font-bold text-center">Workshop Feedback Analyzer (v1)</h1>
      </header>

      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-center text-gray-800">
            <Upload className="mr-2" size={24} />
            Upload Your Spreadsheet
          </h2>
          <FileUpload onFileUpload={handleFileUpload} />
          {isLoading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Analyzing data...</p>
            </div>
          )}
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error:</p>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>
        {analysis && (
          <AnalysisResults analysis={analysis} />
        )}
      </main>

      <footer className="bg-gray-200 p-4 text-center text-sm text-gray-600">
        <p>&copy; 2024 Workshop Feedback Analyzer. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;