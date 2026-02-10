import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, AlertCircle, Keyboard, Loader2, Scan } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

// Barcode formats supported by html5-qrcode
const BARCODE_FORMATS = [
  'EAN_13',
  'EAN_8',
  'UPC_A',
  'UPC_E',
  'CODE_128',
  'CODE_39',
  'QR_CODE'
];

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }): React.ReactElement | null => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const lastScannedRef = useRef<string | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Ready');
  const [scanCount, setScanCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Initialize html5-qrcode only when modal is open and element exists
  useEffect(() => {
    if (!isOpen) {
      // Cleanup when modal closes
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
        isInitializedRef.current = false;
      }
      setIsReady(false);
      setIsScanning(false);
      setHasPermission(null);
      setDetectedBarcode(null);
      lastScannedRef.current = null;
      return;
    }

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const element = document.getElementById('barcode-scanner-reader');
      if (element && !isInitializedRef.current) {
        console.log('[BarcodeScanner] Initializing html5-qrcode...');
        try {
          html5QrCodeRef.current = new Html5Qrcode('barcode-scanner-reader');
          isInitializedRef.current = true;
          setIsReady(true);
          setDebugInfo('Ready to scan');
        } catch (err) {
          console.error('[BarcodeScanner] Failed to initialize:', err);
          setError('Failed to initialize scanner');
          setShowManualInput(true);
        }
      } else if (isInitializedRef.current) {
        setIsReady(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Handle successful scan - immediately accept
  const handleScanSuccess = useCallback((decodedText: string) => {
    // Prevent duplicate scans
    if (lastScannedRef.current === decodedText) {
      return;
    }
    
    lastScannedRef.current = decodedText;
    
    console.log('[BarcodeScanner] Barcode detected:', decodedText);
    setScanCount(prev => prev + 1);
    setDebugInfo(`✅ Detected: ${decodedText}`);
    setDetectedBarcode(decodedText);
    
    // Stop scanning immediately and call onScan
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setIsScanning(false);
        onScan(decodedText);
      }).catch(() => {
        setIsScanning(false);
        onScan(decodedText);
      });
    } else {
      setIsScanning(false);
      onScan(decodedText);
    }
  }, [onScan]);

  // Scan failure handler
  const handleScanFailure = useCallback((error: string) => {
    // Don't spam logs - this is normal when no barcode is visible
  }, []);

  // Start scanning
  const startScanning = useCallback(async () => {
    console.log('[BarcodeScanner] startScanning called');
    
    if (!html5QrCodeRef.current) {
      console.error('[BarcodeScanner] html5QrCode not initialized');
      setError('Scanner not ready. Please try again.');
      return;
    }

    try {
      setError(null);
      setHasPermission(null);
      setIsScanning(true);
      setDebugInfo('Requesting camera...');
      lastScannedRef.current = null;

      const config = {
        fps: 5, // Slower FPS for better accuracy
        qrbox: { width: 280, height: 200 }, // Wider box for barcodes
        aspectRatio: 1.777778, // 16:9 aspect ratio
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true, // Use native detector if available
        tryHarder: true // More thorough scanning
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        handleScanSuccess,
        handleScanFailure
      );

      setHasPermission(true);
      setDebugInfo('Point camera at barcode');
      console.log('[BarcodeScanner] Camera started successfully');

    } catch (err) {
      console.error('[BarcodeScanner] Camera error:', err);
      setIsScanning(false);
      setHasPermission(false);

      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access.');
      } else if (errorMessage.includes('not found')) {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera. Use manual entry.');
      }

      setShowManualInput(true);
    }
  }, [handleScanSuccess, handleScanFailure]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    console.log('[BarcodeScanner] stopScanning called');
    setIsScanning(false);
    setDetectedBarcode(null);

    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        console.log('[BarcodeScanner] Scanner stopped');
      } catch (err) {
        console.error('[BarcodeScanner] Error stopping scanner:', err);
      }
    }
  }, []);

  // Manual scan - pause and resume to force a fresh scan
  const triggerManualScan = useCallback(async () => {
    console.log('[BarcodeScanner] Manual scan triggered');
    setDebugInfo('Scanning...');
    
    if (!html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) {
      // If not scanning, start scanning
      await startScanning();
      return;
    }
    
    // The library is continuously scanning - just update UI to show we're trying
    // The next successful detection will trigger handleScanSuccess
    setScanCount(prev => prev + 1);
    
    // Flash the UI to indicate scan attempt
    setDebugInfo('Looking for barcode...');
    
    setTimeout(() => {
      if (isScanning) {
        setDebugInfo('Point camera at barcode');
      }
    }, 1000);
  }, [isScanning, startScanning]);

  // Auto-start scanning when ready
  useEffect(() => {
    if (isReady && !showManualInput && !isScanning && hasPermission === null) {
      startScanning();
    }
  }, [isReady, showManualInput, isScanning, hasPermission, startScanning]);

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
        {!showManualInput && (
          <div className="flex-1 relative overflow-hidden bg-black min-h-[400px]">
            {/* Scanner container */}
            <div id="barcode-scanner-reader" className="w-full h-full" />

            {/* Manual scan button */}
            {isScanning && (
              <button
                onClick={triggerManualScan}
                className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-400 text-black py-3 px-6 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/30 z-10 animate-pulse"
              >
                <Scan size={20} />
                Tap to Scan
              </button>
            )}

            {/* Start button if not scanning */}
            {!isScanning && hasPermission !== null && isReady && (
              <button
                onClick={startScanning}
                className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-400 text-black py-3 px-6 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/30 z-10"
              >
                <Camera size={20} />
                Start Camera
              </button>
            )}

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Darkened edges */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Clear center area - wider for barcodes */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-32">
                  <div className="w-full h-full bg-transparent relative">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-500" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-500" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-500" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-500" />

                    {/* Horizontal scan line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />

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
                <div className="absolute bottom-36 left-0 right-0 text-center px-4">
                  <p className="text-white/80 text-sm font-medium">
                    Align barcode horizontally within the frame
                  </p>
                  <p className="text-white/60 text-xs mt-1">
                    Hold steady - barcodes need to be level
                  </p>
                </div>

                {/* Debug Info */}
                <div className="absolute top-4 left-4 right-4 bg-black/80 rounded-lg p-3 text-xs font-mono">
                  <p className="text-green-500">Status: {debugInfo}</p>
                  <p className="text-zinc-500">Attempts: {scanCount}</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {(!isReady || hasPermission === null) && !isScanning && (
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
