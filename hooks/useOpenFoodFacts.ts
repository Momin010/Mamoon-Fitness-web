import { useState, useCallback, useRef } from 'react';
import { lookupBarcode as fetchProduct, OpenFoodFactsProduct, OFFLookupResult } from '../lib/openFoodFacts';


interface CacheEntry {
  timestamp: number;
  data: OpenFoodFactsProduct;
}

interface UseOpenFoodFactsReturn {
  product: OpenFoodFactsProduct | null;
  isLoading: boolean;
  error: string | null;
  errorType: 'not_found' | 'no_nutrition_data' | 'api_error' | null;
  lookupBarcode: (barcode: string) => Promise<{ success: boolean; product: OpenFoodFactsProduct | null }>;
  resetCache: () => void;
  clearError: () => void;
}

const CACHE_KEY = 'off-cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RECENT_SCANS_KEY = 'off-recent-scans';
const MAX_RECENT_SCANS = 20;

/**
 * Get cache from localStorage
 */
const getCache = (): Map<string, CacheEntry> => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return new Map();
    
    const parsed = JSON.parse(stored);
    const cache = new Map<string, CacheEntry>();
    
    // Filter out expired entries
    const now = Date.now();
    for (const [key, value] of Object.entries(parsed)) {
      const entry = value as CacheEntry;
      if (now - entry.timestamp < CACHE_EXPIRY_MS) {
        cache.set(key, entry);
      }
    }
    
    return cache;
  } catch {
    return new Map();
  }
};

/**
 * Save cache to localStorage
 */
const saveCache = (cache: Map<string, CacheEntry>) => {
  try {
    const obj: Record<string, CacheEntry> = {};
    cache.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save OFF cache:', error);
  }
};

/**
 * Get recent scans from localStorage
 */
export const getRecentScans = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SCANS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Add barcode to recent scans
 */
const addToRecentScans = (barcode: string) => {
  try {
    const recent = getRecentScans();
    // Remove if already exists (move to top)
    const filtered = recent.filter(b => b !== barcode);
    // Add to beginning
    filtered.unshift(barcode);
    // Keep only max
    const trimmed = filtered.slice(0, MAX_RECENT_SCANS);
    localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save recent scan:', error);
  }
};

/**
 * Get cached product by barcode
 */
export const getCachedProduct = (barcode: string): OpenFoodFactsProduct | null => {
  const cache = getCache();
  const entry = cache.get(barcode);
  
  if (!entry) return null;
  
  // Check expiry
  if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
    cache.delete(barcode);
    saveCache(cache);
    return null;
  }
  
  return entry.data;
};

/**
 * Custom hook for OpenFoodFacts lookups with caching
 */
export const useOpenFoodFacts = (): UseOpenFoodFactsReturn => {
  const [product, setProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<UseOpenFoodFactsReturn['errorType']>(null);
  
  // Use ref for cache to avoid re-renders
  const cacheRef = useRef<Map<string, CacheEntry>>(getCache());

  const lookupBarcode = useCallback(async (barcode: string): Promise<{ success: boolean; product: OpenFoodFactsProduct | null }> => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);
    
    try {
      const cleanBarcode = barcode.trim();
      
      // Check cache first
      const cached = cacheRef.current.get(cleanBarcode);
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
        setProduct(cached.data);
        addToRecentScans(cleanBarcode);
        setIsLoading(false);
        return { success: true, product: cached.data };
      }
      
      // Fetch from API
      const result: OFFLookupResult = await fetchProduct(cleanBarcode);

      
      if (!result.success) {
        setError(result.message || 'Failed to lookup product');
        setErrorType(result.error || 'api_error');
        setProduct(null);
        setIsLoading(false);
        return { success: false, product: null };
      }
      
      if (result.product) {
        // Update cache
        const entry: CacheEntry = {
          timestamp: Date.now(),
          data: result.product
        };
        cacheRef.current.set(cleanBarcode, entry);
        saveCache(cacheRef.current);
        
        // Add to recent scans
        addToRecentScans(cleanBarcode);
        
        setProduct(result.product);
        setIsLoading(false);
        return { success: true, product: result.product };
      }
      
      setError('No product data received');
      setErrorType('api_error');
      setProduct(null);
      setIsLoading(false);
      return { success: false, product: null };
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setErrorType('api_error');
      setProduct(null);
      setIsLoading(false);
      return { success: false, product: null };
    }
  }, []);

  const resetCache = useCallback(() => {
    cacheRef.current = new Map();
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(RECENT_SCANS_KEY);
    setProduct(null);
    setError(null);
    setErrorType(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  return {
    product,
    isLoading,
    error,
    errorType,
    lookupBarcode,
    resetCache,
    clearError
  };
};

export default useOpenFoodFacts;
