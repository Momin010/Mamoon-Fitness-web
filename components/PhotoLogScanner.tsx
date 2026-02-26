import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, AlertCircle, Loader2, Sparkles, RefreshCw, Zap, Search } from 'lucide-react';

export type ScanMode = 'normal' | 'specific';

interface PhotoLogScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBuffer: string, mode: ScanMode) => void;
  isAnalyzing: boolean;
}

const PhotoLogScanner: React.FC<PhotoLogScannerProps> = ({ isOpen, onClose, onCapture, isAnalyzing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('normal');

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(base64Image, scanMode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="text-green-500" size={20} />
          AI Photo Log
        </h2>
        <button
          onClick={onClose}
          className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md aspect-[3/4] relative bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800 shadow-2xl">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <p className="text-red-400 font-medium mb-6">{error}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-green-500 text-black rounded-xl font-bold flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-12">
              <div className="w-full h-full border-2 border-white/20 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-500 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-500 rounded-br-xl" />
              </div>
            </div>

            {/* Loading Indicator */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                <div className="w-20 h-20 relative">
                  <Loader2 className="animate-spin text-green-500 w-full h-full" size={48} />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={24} />
                </div>
                <p className="mt-4 text-white font-black uppercase tracking-widest text-sm animate-pulse">Running Gemini AI...</p>
                <p className="text-zinc-400 text-xs mt-1 italic">
                  {scanMode === 'normal' ? 'Quick analysis mode' : 'Searching database for accuracy...'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      {!isAnalyzing && !error && (
        <div className="w-full max-w-md pt-8 flex flex-col items-center gap-6 px-6">
          {/* Scan Mode Toggle */}
          <div className="w-full bg-zinc-900 rounded-2xl p-2 border border-zinc-800">
            <div className="flex gap-1">
              <button
                onClick={() => setScanMode('normal')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
                  scanMode === 'normal'
                    ? 'bg-green-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Zap size={18} />
                <span className="text-sm">Quick</span>
              </button>
              <button
                onClick={() => setScanMode('specific')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
                  scanMode === 'specific'
                    ? 'bg-blue-500 text-white font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Search size={18} />
                <span className="text-sm">Specific</span>
              </button>
            </div>
            <p className="text-center text-zinc-500 text-xs mt-2 px-2">
              {scanMode === 'normal' 
                ? 'Fast AI analysis. Gemini estimates macros directly from the image.'
                : 'Searches OpenFoodFacts for exact product matches. More accurate but slower.'}
            </p>
          </div>

          <p className="text-zinc-500 text-sm text-center">
            Position your food or drink in the frame and tap to analyze
          </p>

          <button
            onClick={capturePhoto}
            className="group relative"
          >
            {/* Outer ring */}
            <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center transition-all group-active:scale-95">
              {/* Inner button */}
              <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-black/10" />
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-green-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={onClose}
            className="text-zinc-500 font-bold hover:text-white transition-colors"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoLogScanner;
