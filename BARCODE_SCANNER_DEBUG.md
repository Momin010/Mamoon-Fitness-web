# Barcode Scanner Debug Guide

## ⚠️ **IMPORTANT: Desktop Chrome/Edge Users**

The BarcodeDetector API is **disabled by default** on desktop Chrome/Edge!

### Enable Camera Scanning (Desktop Only):
1. Open a new tab
2. Go to: `chrome://flags` (or `edge://flags` for Edge)
3. Search for: **"Experimental Web Platform features"**
4. Change to: **"Enabled"**
5. Click **"Relaunch"** button at the bottom
6. Try the scanner again

**OR** just use **manual entry** - it works perfectly! 👍

---

## How to Debug the Scanner

### Step 1: Open Browser Console
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

### Step 2: Click "Scan Barcode" Button
Watch the console for these logs:

## Expected Log Sequence

### 1. Initial Load (When page loads)
```
[BarcodeScanner] Checking BarcodeDetector support...
[BarcodeScanner] User Agent: <your browser info>
[BarcodeScanner] BarcodeDetector available: true/false
```

**If `false`**: The browser doesn't support BarcodeDetector API
- ✅ **Chrome 83+** (desktop/Android)
- ✅ **Edge 83+** (desktop)
- ❌ **Firefox** (not supported yet)
- ❌ **Safari** (not supported)

### 2. When You Click "Scan Barcode"
```
[BarcodeScanner] Modal state changed - isOpen: true
[BarcodeScanner] Opening scanner modal
[BarcodeScanner] Starting camera...
[BarcodeScanner] startScanning called
[BarcodeScanner] isSupported: true
[BarcodeScanner] Requesting camera access...
```

### 3. Camera Permission Granted
```
[BarcodeScanner] Camera access granted!
[BarcodeScanner] Stream tracks: [{ kind: 'video', label: '...' }]
[BarcodeScanner] Video element playing
[BarcodeScanner] Initializing BarcodeDetector...
[BarcodeScanner] BarcodeDetector initialized successfully
```

### 4. During Scanning
```
[BarcodeScanner] detectLoop skipped - not ready { isScanning: true, hasDetector: true, hasVideo: true }
[BarcodeScanner] Barcode detected: 1234567890123
[BarcodeScanner] Detection count: 1
[BarcodeScanner] Detection count: 2
[BarcodeScanner] Detection count: 3
[BarcodeScanner] ✓ Barcode confirmed: 1234567890123
```

## Common Issues & Solutions

### Issue 1: "BarcodeDetector available: false"
**Cause**: Browser doesn't support the API
**Solution**: 
- Use Chrome or Edge (latest version)
- Use manual barcode entry instead

### Issue 2: "Camera permission denied"
**Cause**: User blocked camera access
**Solution**:
1. Click the camera icon in address bar
2. Allow camera access
3. Refresh the page

### Issue 3: "No camera found"
**Cause**: No camera connected to device
**Solution**: Use manual barcode entry

### Issue 4: Camera opens but no detection
**Cause**: BarcodeDetector initialization failed
**Look for**: Error in `Initializing BarcodeDetector...` step
**Solution**: Check if browser version is up to date

### Issue 5: HTTPS Required
**Cause**: Camera API requires secure context
**Solution**: Access via `https://` or `localhost`

## Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome  | ✅ 83+  | ✅ 83+ | Full support |
| Edge    | ✅ 83+  | ✅ 83+ | Full support |
| Firefox | ❌      | ❌     | Not supported |
| Safari  | ❌      | ❌     | Not supported |

## Testing the Scanner

### Test Barcodes (Use manual entry for testing):
- **Coca-Cola**: `5449000000996`
- **Nutella**: `3017620422003`
- **Red Bull**: `9002490100070`
- **Snickers**: `5000159461122`

### What to Share for Debugging:
1. Full console log output
2. Browser name and version
3. Operating system
4. Any error messages (red text in console)
5. Screenshot of the error state

## Manual Entry Fallback
If camera scanning doesn't work:
1. Click "Type Barcode Manually" button
2. Enter the 8-13 digit barcode number
3. Click "Lookup Product"
