import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, AlertCircle, Keyboard, Loader2, Scan, Flashlight } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }): React.ReactElement | null => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const lastScannedRef = useRef<string | null>(null);
  const scanAttemptsRef = useRef<number>(0);

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
      scanAttemptsRef.current = 0;
      return;
    }

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const element = document.getElementById('barcode-scanner-reader');
      if (element && !isInitializedRef.current) {
        console.log('[BarcodeScanner] Initializing html5-qrcode...');
        try {
          // Configure for barcode scanning specifically
          const config = {
            fps: 10,
            qrbox: { width: 300, height: 150 }, // Wide rectangle for barcodes
            supportedScanTypes: [
              Html5QrcodeScanType.SCAN_TYPE_CAMERA
            ],
            formatsToSupport: [
              0,  // EAN_13
              1,  // EAN_8
              2,  // CODE_128
              3,  // CODE_39
              4,  // UPC_A
              5,  // UPC_E
              6,  // QR_CODE
            ],
            useBarCodeDetectorIfSupported: true,
            tryHarder: true,
            experimentalFeatures: {
              newBarcodeDetector: true
            }
          };
          
          html5QrCodeRef.current = new Html5Qrcode('barcode-scanner-reader', { verbose: true });
          isInitializedRef.current = true;
          setIsReady(true);
          setDebugInfo('Ready to scan');
          console.log('[BarcodeScanner] Initialized successfully');
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
  const handleScanSuccess = useCallback((decodedText: string, decodedResult: any) => {
    console.log('[BarcodeScanner] SUCCESS! Barcode:', decodedText, 'Result:', decodedResult);
    
    // Prevent duplicate scans
    if (lastScannedRef.current === decodedText) {
      console.log('[BarcodeScanner] Duplicate scan, ignoring');
      return;
    }
    
    lastScannedRef.current = decodedText;
    
    setScanCount(prev => prev + 1);
    setDebugInfo(`✅ Found: ${decodedText}`);
    setDetectedBarcode(decodedText);
    
    // Stop scanning immediately and call onScan
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setIsScanning(false);
        console.log('[BarcodeScanner] Calling onScan with:', decodedText);
        onScan(decodedText);
      }).catch((err) => {
        console.error('[BarcodeScanner] Error stopping:', err);
        setIsScanning(false);
        onScan(decodedText);
      });
    } else {
      setIsScanning(false);
      onScan(decodedText);
    }
  }, [onScan]);

  // Scan failure handler - log for debugging
  const handleScanFailure = useCallback((error: string) => {
    scanAttemptsRef.current++;
    // Log every 10 failures to avoid spam
    if (scanAttemptsRef.current % 10 === 0) {
      console.log('[BarcodeScanner] Scan attempt', scanAttemptsRef.current, '- No barcode detected');
      setDebugInfo(`Scanning... (${scanAttemptsRef.current} attempts)`);
    }
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
      scanAttemptsRef.current = 0;

      // Simple config optimized for barcodes
      const config = {
        fps: 5,
        qrbox: { width: 280, height: 150 }, // Wide for barcodes
        aspectRatio: 1.777778,
        formatsToSupport: [
          0,  // EAN_13
          1,  // EAN_8  
          2,  // CODE_128
          3,  // CODE_39
          4,  // UPC_A
          5,  // UPC_E
        ],
        useBarCodeDetectorIfSupported: true,
        tryHarder: true
      };

      console.log('[BarcodeScanner] Starting camera with config:', config);

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
      
      if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
        setError('Camera permission denied. Please allow camera access and refresh.');
      } else if (errorMessage.includes('not found') || errorMessage.includes('NotFoundError')) {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${errorMessage}. Use manual entry.`);
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

  // Manual scan - just visual feedback, library is continuously scanning
  const triggerManualScan = useCallback(() => {
    console.log('[BarcodeScanner] Manual scan button pressed');
    scanAttemptsRef.current = 0;
    setScanCount(prev => prev + 1);
    setDebugInfo('Hold steady... looking for barcode');
    
    // Visual feedback
    setTimeout(() => {
      if (isScanning) {
        setDebugInfo('Make sure barcode is level and well-lit');
      }
    }, 1500);
  }, [isScanning]);

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
      console.log('[BarcodeScanner] Manual entry:', manualBarcode.trim());
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
                className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-400 active:bg-green-300 text-black py-3 px-8 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/30 z-10"
              >
                <Scan size={20} className="animate-pulse" />
                Scanning...
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
                <div className="absolute inset-0 bg-black/20" />

                {/* Clear center area - wide rectangle for barcodes */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-28">
                  <div className="w-full h-full bg-transparent relative border-2 border-green-500/50 rounded-lg">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-500 rounded-br-lg" />

                    {/* Center line */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-green-500/50" />

                    {/* Detected indicator */}
                    {detectedBarcode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 rounded-lg">
                        <div className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-lg">
                          ✓ Detected!
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-36 left-0 right-0 text-center px-4">
                  <p className="text-white text-sm font-bold mb-1">
                    Align barcode horizontally
                  </p>
                  <p className="text-white/70 text-xs">
                    Hold phone steady • Good lighting helps
                  </p>
                </div>

                {/* Debug Info */}
                <div className="absolute top-4 left-4 right-4 bg-black/80 rounded-lg p-3 text-xs font-mono">
                  <p className="text-green-400">{debugInfo}</p>
                  <p className="text-zinc-500 text-[10px]">Attempts: {scanAttemptsRef.current}</p>
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
