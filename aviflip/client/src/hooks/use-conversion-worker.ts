import { useState, useEffect, useRef } from 'react';

interface ConversionWorkerState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  processingFile: number;
  result: Blob | null;
  error: string | null;
}

interface UseConversionWorkerResult extends ConversionWorkerState {
  convertSingle: (file: File) => void;
  convertBatch: (files: File[]) => void;
  reset: () => void;
}

// Hook to handle conversion via web worker
export function useConversionWorker(): UseConversionWorkerResult {
  const [state, setState] = useState<ConversionWorkerState>({
    status: 'idle',
    progress: 0,
    processingFile: 0,
    result: null,
    error: null
  });
  
  // Keep a reference to the worker to avoid recreating it on re-renders
  const workerRef = useRef<Worker | null>(null);
  
  // Initialize worker
  useEffect(() => {
    // Create worker only once
    if (!workerRef.current) {
      try {
        // Create worker
        workerRef.current = new Worker(
          new URL('../workers/conversion.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Set up message handler
        workerRef.current.onmessage = (event) => {
          const { status, progress, file, result, error } = event.data;
          
          if (status === 'progress') {
            setState(prev => ({
              ...prev,
              progress,
              processingFile: file,
            }));
          } else if (status === 'success') {
            setState({
              status: 'success',
              progress: 100,
              processingFile: 0,
              result,
              error: null
            });
          } else if (status === 'error') {
            setState({
              status: 'error',
              progress: 0,
              processingFile: 0,
              result: null,
              error
            });
          }
        };
      } catch (error) {
        console.error('Failed to create web worker:', error);
      }
    }
    
    // Clean up worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  // Function to convert a single file
  const convertSingle = (file: File) => {
    if (!workerRef.current) return;
    
    setState({
      status: 'processing',
      progress: 0,
      processingFile: 0,
      result: null,
      error: null
    });
    
    workerRef.current.postMessage({
      type: 'single',
      files: [file]
    });
  };
  
  // Function to convert multiple files
  const convertBatch = (files: File[]) => {
    if (!workerRef.current) return;
    
    setState({
      status: 'processing',
      progress: 0,
      processingFile: 0,
      result: null,
      error: null
    });
    
    workerRef.current.postMessage({
      type: 'batch',
      files
    });
  };
  
  // Reset state
  const reset = () => {
    setState({
      status: 'idle',
      progress: 0,
      processingFile: 0,
      result: null,
      error: null
    });
  };
  
  return {
    ...state,
    convertSingle,
    convertBatch,
    reset
  };
}