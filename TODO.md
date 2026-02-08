# OpenFoodFacts Barcode Integration - Implementation TODO

## Phase 1: Core Infrastructure
- [x] Create `lib/openFoodFacts.ts` - API service with smart normalization
  - [x] Fetch from OFF API
  - [x] Normalize macros (priority: 100g → serving → kJ conversion)
  - [x] Extract serving size, product name, brand
  - [x] Handle errors: not_found, no_nutrition_data, partial_data
- [x] Create `hooks/useOpenFoodFacts.ts` - Custom hook with caching
  - [x] 24h cache expiration
  - [x] localStorage cache with timestamp
  - [x] resetCache() function
  - [x] Loading/error states

## Phase 2: UI Components
- [x] Create `components/BarcodeScanner.tsx` - Scanner modal
  - [x] Native BarcodeDetector API
  - [x] Force rear camera (facingMode: "environment")
  - [x] Stabilizer: 3 consecutive detections
  - [x] Pulsing green scanning frame (green-500 theme)
  - [x] Manual input fallback for Safari
  - [x] Permission denied handling
- [x] Create `components/BarcodeMealPreview.tsx` - Product preview card
  - [x] Display product name, brand, image
  - [x] Serving size adjuster (auto-detect from OFF)
  - [x] Macro display with confidence warnings
  - [x] "Add to Meal" button

## Phase 3: Integration
- [x] Update `pages/AddMealPage.tsx`
  - [x] Enable barcode button
  - [x] Open scanner modal on click
  - [x] Show preview card after scan
  - [x] Prefill form with normalized data
  - [x] Recent scans quick-add section
- [x] Update `types/index.ts`
  - [x] Add barcode?: string to Meal
  - [x] Add servingSize?: number
- [x] Update `lib/database.types.ts`
  - [x] Add barcode, product_data, serving_size, normalized_macros

## Phase 4: UX Polish
- [x] Add loading skeletons
- [x] Add error toasts
- [x] Add missing-macro warnings
- [x] Add recent scans (last 20 in localStorage)
- [x] Test on mobile devices

## Status: COMPLETED ✅

All components implemented successfully:
- Smart macro normalization with fallback chain (100g → serving → kJ conversion)
- 24h cache expiration with automatic cleanup
- Barcode stabilizer requiring 3 consecutive detections
- Rear camera forcing with Safari manual fallback
- Serving size auto-detection from OFF data
- Confidence warnings for partial nutrition data
- normalized_macros JSONB storage for consistency
- Recent scans quick-add feature (last 20 barcodes)
