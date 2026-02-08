import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, AlertCircle, Keyboard, Loader2 } from 'lucide-react';

// Type declaration for BarcodeDetector API
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => {
      detect: (image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap | Blob | ImageData) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

interface ScanResult {
  barcode: string;
  count: number;
  lastSeen: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }): React.ReactElement | null => {

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null); // BarcodeDetector type
  const animationRef = useRef<number | null>(null);
  const scanResultsRef = useRef<Map<string, ScanResult>>(new Map());

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');
  const [loopCount, setLoopCount] = useState(0);

  // Check if BarcodeDetector is supported
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log('[BarcodeScanner] Window is undefined');
      return;
    }

    console.log('[BarcodeScanner] Checking BarcodeDetector support...');
    console.log('[BarcodeScanner] User Agent:', navigator.userAgent);
    console.log('[BarcodeScanner] BarcodeDetector in window:', 'BarcodeDetector' in window);
    console.log('[BarcodeScanner] typeof BarcodeDetector:', typeof (window as any).BarcodeDetector);

    // Check if BarcodeDetector exists
    if ('BarcodeDetector' in window && typeof (window as any).BarcodeDetector === 'function') {
      console.log('[BarcodeScanner] ✅ BarcodeDetector API is supported!');
      setIsSupported(true);
      setShowManualInput(false); // Start with camera view

      // Try to get supported formats (optional, for debugging)
      try {
        const detector = (window as any).BarcodeDetector;
        if (typeof detector.getSupportedFormats === 'function') {
          detector.getSupportedFormats().then((formats: string[]) => {
            console.log('[BarcodeScanner] Supported formats:', formats);
          }).catch((err: Error) => {
            console.error('[BarcodeScanner] Error getting formats:', err);
          });
        }
      } catch (err) {
        console.error('[BarcodeScanner] Error checking formats:', err);
      }
    } else {
      console.warn('[BarcodeScanner] ❌ BarcodeDetector API not supported in this browser');
      setIsSupported(false);
      setShowManualInput(true);

      // Check if it's Chrome/Edge (which support it but need flag enabled)
      const isChrome = /Chrome|Edg/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      if (isChrome && !isAndroid) {
        setError('Camera scanning requires enabling "Experimental Web Platform features" in chrome://flags. Use manual entry for now.');
      } else {
        setError('Camera scanning not supported in this browser. Please use manual entry.');
      }
    }
  }, []);

  // Initialize camera and detector
  const startScanning = useCallback(async () => {
    console.log('[BarcodeScanner] startScanning called');
    console.log('[BarcodeScanner] isSupported:', isSupported);

    if (!isSupported) {
      console.log('[BarcodeScanner] Skipping camera - not supported');
      return;
    }

    try {
      console.log('[BarcodeScanner] Requesting camera access...');
      setError(null);
      setHasPermission(null);

      // Request camera with rear-facing preference
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log('[BarcodeScanner] Camera access granted!');
      console.log('[BarcodeScanner] Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, label: t.label })));

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('[BarcodeScanner] Video element playing');
      }

      setHasPermission(true);
      setIsScanning(true);

      // Initialize barcode detector
      console.log('[BarcodeScanner] Initializing BarcodeDetector...');
      detectorRef.current = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
      });
      console.log('[BarcodeScanner] BarcodeDetector initialized successfully');

      // Start detection loop
      detectLoop();

    } catch (err) {
      console.error('[BarcodeScanner] Camera error:', err);
      console.error('[BarcodeScanner] Error type:', err instanceof DOMException ? err.name : typeof err);
      console.error('[BarcodeScanner] Error message:', err instanceof Error ? err.message : String(err));

      setHasPermission(false);
      setIsScanning(false);

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to access camera. Use manual entry.');
      }

      setShowManualInput(true);
    }
  }, [isSupported]);

  // Stop scanning and cleanup
  const stopScanning = useCallback(() => {
    setIsScanning(false);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    detectorRef.current = null;
    scanResultsRef.current.clear();
    setDetectedBarcode(null);
  }, []);

  // Detection loop with stabilizer
  const detectLoop = useCallback(async () => {
    setLoopCount(prev => prev + 1);

    if (!isScanning || !detectorRef.current || !videoRef.current) {
      setDebugInfo('Loop stopped - not ready');
      return;
    }

    try {
      setDebugInfo('Scanning...');
      const barcodes = await detectorRef.current.detect(videoRef.current);

      if (barcodes.length > 0) {
        const barcode = barcodes[0].rawValue;
        const now = Date.now();

        const existing = scanResultsRef.current.get(barcode);

        if (existing) {
          existing.count++;
          existing.lastSeen = now;

          setDebugInfo(`Found: ${barcode.slice(0, 8)}... (${existing.count}/3)`);

          if (existing.count >= 3) {
            // Confirmed detection
            setDebugInfo(`✅ Confirmed: ${barcode}`);
            setDetectedBarcode(barcode);
            setIsScanning(false);
            onScan(barcode);
            return; // Stop loop
          }
        } else {
          setDebugInfo(`Detected: ${barcode.slice(0, 8)}... (1/3)`);
          scanResultsRef.current.set(barcode, {
            barcode,
            count: 1,
            lastSeen: now
          });
        }

        // Clean up old detections (>500ms)
        scanResultsRef.current.forEach((result, key) => {
          if (now - result.lastSeen > 500) {
            scanResultsRef.current.delete(key);
          }
        });
      } else {
        setDebugInfo('No barcode in frame');
      }
    } catch (err) {
      setDebugInfo(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    // Continue loop
    if (isScanning) {
      setTimeout(() => {
        detectLoop();
      }, 100);
    }
  }, [isScanning, onScan]);

  // Start/stop based on isOpen
  useEffect(() => {
    console.log('[BarcodeScanner] Modal state changed - isOpen:', isOpen);

    if (isOpen) {
      console.log('[BarcodeScanner] Opening scanner modal');
      if (isSupported) {
        console.log('[BarcodeScanner] Starting camera...');
        startScanning();
      } else {
        console.log('[BarcodeScanner] Camera not supported, showing manual input');
      }
    } else {
      console.log('[BarcodeScanner] Closing scanner modal');
      stopScanning();
    }

    return () => {
      console.log('[BarcodeScanner] Cleanup on unmount');
      stopScanning();
    };
  }, [isOpen, isSupported, startScanning, stopScanning]);

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim().length >= 8) {
      onScan(manualBarcode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 shrink-0">
          <h2 className="text-lg font-bold">Scan Barcode</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl shrink-0">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Camera View */}
        {(() => {
          console.log('[BarcodeScanner] Render check - isSupported:', isSupported, 'showManualInput:', showManualInput, 'hasPermission:', hasPermission);
          return null;
        })()}
        {isSupported && !showManualInput && (
          <div className="flex-1 relative overflow-hidden bg-black min-h-[400px]">
            {/* Video */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Darkened edges */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Clear center area */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-48">
                <div className="w-full h-full bg-transparent relative">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-500" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-500" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-500" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-500" />

                  {/* Pulsing scan line */}
                  {isScanning && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-scan" />
                  )}

                  {/* Detected indicator */}
                  {detectedBarcode && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                      <div className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold">
                        Detected!
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-20 left-0 right-0 text-center">
                <p className="text-white/80 text-sm font-medium">
                  Hold barcode within the frame
                </p>
              </div>

              {/* Debug Info */}
              <div className="absolute top-4 left-4 right-4 bg-black/80 rounded-lg p-3 text-xs font-mono">
                <p className="text-green-500">Status: {debugInfo}</p>
                <p className="text-zinc-500">Scans: {loopCount}</p>
              </div>
            </div>

            {/* Loading state */}
            {hasPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Loader2 className="animate-spin text-green-500" size={48} />
              </div>
            )}
          </div>
        )}

        {/* Manual Input */}
        {showManualInput && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
              <Keyboard size={40} className="text-zinc-500" />
            </div>

            <h3 className="text-xl font-bold mb-2">Enter Barcode</h3>
            <p className="text-zinc-500 text-sm mb-6 text-center">
              Type the barcode number found on the product packaging
            </p>

            <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g., 123456789012"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-center text-xl font-mono tracking-wider focus:border-green-500 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={manualBarcode.length < 8}
                className="w-full bg-green-500 text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Lookup Product
              </button>
            </form>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="p-4 bg-zinc-900 space-y-3 shrink-0">
          {isSupported && (
            <button
              onClick={() => {
                setShowManualInput(!showManualInput);
                if (!showManualInput) {
                  stopScanning();
                } else {
                  startScanning();
                }
              }}
              className="w-full py-3 bg-zinc-800 rounded-xl font-medium text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              {showManualInput ? (
                <>
                  <Camera size={18} />
                  Use Camera Scanner
                </>
              ) : (
                <>
                  <Keyboard size={18} />
                  Type Barcode Manually
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 text-zinc-500 font-medium text-sm hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* CSS for scan animation */}
        <style>{`
          @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .animate-scan {
            animation: scan 2s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BarcodeScanner;
