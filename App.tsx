
import React, { useState, useCallback, useEffect } from 'react';
import { removeBackground } from './services/geminiService';
import { UploadIcon, DownloadIcon, SparklesIcon, XCircleIcon, ArrowPathIcon } from './components/Icons';

type AppState = 'initial' | 'loading' | 'result' | 'error';

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('initial');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Clean up the object URL when the component unmounts or the URL changes
    return () => {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }
    };
  }, [originalImageUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setAppState('loading');
    setOriginalFile(file);
    setProcessedImageUrl(null);
    setErrorMessage('');

    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);

    try {
      const resultBase64 = await removeBackground(file);
      setProcessedImageUrl(`data:image/png;base64,${resultBase64}`);
      setAppState('result');
    } catch (error) {
      console.error('Error processing image:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred. Please try again.');
      setAppState('error');
    }
  };

  const handleReset = useCallback(() => {
    setOriginalFile(null);
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setErrorMessage('');
    setAppState('initial');
  }, [originalImageUrl]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-400', 'bg-gray-800');
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-indigo-400', 'bg-gray-800');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-400', 'bg-gray-800');
  };

  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return <LoadingView imageUrl={originalImageUrl} />;
      case 'result':
        return <ResultView original={originalImageUrl!} processed={processedImageUrl!} fileName={originalFile?.name} onReset={handleReset} />;
      case 'error':
        return <ErrorView message={errorMessage} onReset={handleReset} />;
      case 'initial':
      default:
        return <UploadView onFileChange={handleFileChange} onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <Header />
      <main className="w-full max-w-4xl mx-auto flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

const Header: React.FC = () => (
  <header className="w-full max-w-4xl mx-auto py-6 text-center">
    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center gap-3">
      <SparklesIcon /> AI Background Remover
    </h1>
    <p className="text-gray-400 mt-2 text-lg">Upload an image to magically remove the background with perfect quality.</p>
  </header>
);

const UploadView: React.FC<{
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ onFileChange, onDrop, onDragOver, onDragEnter, onDragLeave }) => (
  <div 
    className="w-full max-w-xl p-8 bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-600 transition-all duration-300 ease-in-out text-center"
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragEnter={onDragEnter}
    onDragLeave={onDragLeave}
  >
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="mx-auto h-20 w-20 text-gray-500">
        <UploadIcon />
      </div>
      <p className="text-xl font-semibold text-gray-300">Drag & drop your image here</p>
      <p className="text-gray-500">or</p>
      <label htmlFor="file-upload" className="relative cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105 inline-flex items-center gap-2">
        <UploadIcon className="h-5 w-5" />
        <span>Choose a file</span>
      </label>
      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={onFileChange} />
      <p className="text-xs text-gray-500 pt-2">PNG, JPG, WEBP supported</p>
    </div>
  </div>
);

const LoadingView: React.FC<{ imageUrl: string | null }> = ({ imageUrl }) => (
  <div className="text-center flex flex-col items-center">
    {imageUrl && <img src={imageUrl} alt="Uploading" className="max-h-64 rounded-lg shadow-lg mb-6 border-4 border-indigo-500/50" />}
    <div className="flex items-center space-x-3 text-2xl font-semibold text-indigo-300">
      <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
      <span>Processing Image...</span>
    </div>
    <p className="text-gray-400 mt-2">The AI is working its magic. Please wait a moment.</p>
  </div>
);

const ResultView: React.FC<{ original: string; processed: string; fileName?: string, onReset: () => void }> = ({ original, processed, fileName, onReset }) => {
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = processed;
    const baseName = fileName?.substring(0, fileName.lastIndexOf('.')) || 'image';
    link.download = `${baseName}_no_bg.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="w-full flex flex-col items-center space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-3 text-gray-300">Original</h3>
          <img src={original} alt="Original" className="w-full h-auto object-contain rounded-lg shadow-2xl max-h-96 border-2 border-gray-700" />
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-3 text-gray-300">Background Removed</h3>
          <div className="w-full h-auto object-contain rounded-lg shadow-2xl max-h-96 border-2 border-gray-700 bg-checkered p-2">
            <img src={processed} alt="Processed" className="w-full h-auto object-contain" />
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
        <button onClick={downloadImage} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-200 hover:scale-105 inline-flex items-center gap-2 text-lg">
          <DownloadIcon />
          Download
        </button>
        <button onClick={onReset} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-200 hover:scale-105 inline-flex items-center gap-2 text-lg">
          <ArrowPathIcon />
          Try Another
        </button>
      </div>
    </div>
  );
};

const ErrorView: React.FC<{ message: string; onReset: () => void }> = ({ message, onReset }) => (
  <div className="text-center bg-red-900/50 border-2 border-red-500 p-8 rounded-2xl flex flex-col items-center gap-4">
    <XCircleIcon className="h-16 w-16 text-red-400" />
    <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
    <p className="text-red-200 max-w-md">{message}</p>
    <button onClick={onReset} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105 inline-flex items-center gap-2 mt-4">
      <ArrowPathIcon />
      Try Again
    </button>
  </div>
);

const Footer: React.FC = () => (
  <footer className="w-full max-w-4xl mx-auto py-4 text-center text-gray-500 text-sm">
    <p>Powered by Google Gemini API. Built with React & Tailwind CSS.</p>
  </footer>
);

export default App;
