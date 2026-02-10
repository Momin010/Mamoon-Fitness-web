import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, AlertCircle, Keyboard, Loader2, Scan } from 'lucide-react';
import Quagga from '@ericblade/quagga2';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }): React.ReactElement | null => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);
  const lastScannedRef = useRef<string | null>(null);
  const detectionCountRef = useRef<Map<string, number>>(new Map());

  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Ready');
  const [scanCount, setScanCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('[BarcodeScanner] Cleanup called');
    
    if (isInitializedRef.current) {
      Quagga.stop().catch(() => {});
      Quagga.offDetected();
      isInitializedRef.current = false;
    }
    
    setIsScanning(false);
    detectionCountRef.current.clear();
  }, []);

  // Handle barcode detection
  const handleDetected = useCallback((result: any) => {
    if (!result || !result.codeResult) return;
    
    const code = result.codeResult.code;
    if (!code) return;
    
    setScanCount(prev => prev + 1);
    
    // Track detection count for this barcode
    const currentCount = detectionCountRef.current.get(code) || 0;
    const newCount = currentCount + 1;
    detectionCountRef.current.set(code, newCount);
    
    console.log(`[BarcodeScanner] Detected ${code} (${newCount}/2 times, format: ${result.codeResult.format})`);
    
    // Require 2 consecutive detections to confirm
    if (newCount >= 2 && code !== lastScannedRef.current) {
      lastScannedRef.current = code;
      setDetectedBarcode(code);
      setDebugInfo(`✅ Found: ${code}`);
      
      // Stop and return result
      cleanup();
      onScan(code);
    } else {
      setDebugInfo(`Found: ${code.slice(0, 8)}... (${newCount}/2)`);
    }
  }, [cleanup, onScan]);

  // Start Quagga scanner
  const startScanning = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log('[BarcodeScanner] Already initialized');
      return;
    }
    
    console.log('[BarcodeScanner] Starting Quagga2 scanner...');
    setError(null);
    setDebugInfo('Requesting camera...');
    lastScannedRef.current = null;
    detectionCountRef.current.clear();
    
    try {
      await Quagga.init({
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current!,
          constraints: {
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          }
        },
        decoder: {
          readers: [
            "ean_reader",        // EAN-13 (European food products)
            "ean_8_reader",      // EAN-8 (smaller products)
            "upc_reader",        // UPC-A (US/Canada products)
            "upc_e_reader",      // UPC-E (compressed UPC)
            "code_128_reader"    // Code 128 (some products)
          ],
          multiple: false
        },
        locate: true,
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency ? Math.max(1, navigator.hardwareConcurrency - 1) : 2,
        frequency: 10
      }, (err) => {
        if (err) {
          console.error('[BarcodeScanner] Quagga init error:', err);
          setError(`Camera error: ${err.message || err}. Use manual entry.`);
          setShowManualInput(true);
          return;
        }
        
        console.log('[BarcodeScanner] Quagga initialized successfully');
        isInitializedRef.current = true;
        setIsScanning(true);
        setDebugInfo('Point at barcode');
        
        Quagga.onDetected(handleDetected);
        Quagga.start();
      });
    } catch (err) {
      console.error('[BarcodeScanner] Failed to initialize:', err);
      setError('Failed to initialize scanner. Use manual entry.');
      setShowManualInput(true);
    }
  }, [handleDetected]);

  // Stop scanner
  const stopScanning = useCallback(() => {
    console.log('[BarcodeScanner] Stopping scanner...');
    cleanup();
    setDetectedBarcode(null);
  }, [cleanup]);

  // Initialize on open
  useEffect(() => {
    if (isOpen && !showManualInput && !isInitializedRef.current) {
      const timer = setTimeout(() => {
        startScanning();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showManualInput, startScanning]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
    return () => {
      cleanup();
    };
  }, [isOpen, cleanup]);

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
          <h2 className="text-lg font-bold">Scan Food Barcode</h2>
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
        {!showManualInput && (
          <div className="flex-1 relative overflow-hidden bg-black min-h-[400px]">
            {/* Quagga scanner container */}
            <div ref={scannerRef} className="absolute inset-0 w-full h-full" />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Clear center area */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-28">
                  <div className="w-full h-full bg-transparent relative border-2 border-green-500/60 rounded-lg">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-500 rounded-br-lg" />

                    {/* Detected indicator */}
                    {detectedBarcode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 rounded-lg">
                        <div className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-lg">
                          ✓ Found: {detectedBarcode}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-24 left-0 right-0 text-center px-4">
                  <p className="text-white text-sm font-bold mb-1">
                    Align barcode horizontally in the box
                  </p>
                  <p className="text-white/70 text-xs">
                    Supports EAN-13, UPC-A, EAN-8 barcodes
                  </p>
                </div>

                {/* Debug Info */}
                <div className="absolute top-4 left-4 right-4 bg-black/80 rounded-lg p-3 text-xs font-mono">
                  <p className="text-green-400">{debugInfo}</p>
                  <p className="text-zinc-500 text-[10px]">Scans: {scanCount}</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <Loader2 className="animate-spin text-green-500 mx-auto mb-4" size={48} />
                  <p className="text-white/80">Starting camera...</p>
                </div>
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
              Type the numbers under the barcode
            </p>

            <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g., 6416453001234"
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
          <button
            onClick={() => {
              setShowManualInput(!showManualInput);
              if (!showManualInput) {
                stopScanning();
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

          <button
            onClick={onClose}
            className="w-full py-3 text-zinc-500 font-medium text-sm hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
