
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
    setIsLoaded(true);
  }, [key]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export function useLocalStorageWithExpiry<T>(
  key: string, 
  initialValue: T, 
  expiryHours: number = 24
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const item = window.localStorage.getItem(key);
      const timestamp = window.localStorage.getItem(`${key}_timestamp`);
      
      if (item && timestamp) {
        const savedTime = parseInt(timestamp, 10);
        const now = Date.now();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff > expiryHours) {
          setIsExpired(true);
          window.localStorage.removeItem(key);
          window.localStorage.removeItem(`${key}_timestamp`);
        } else {
          setStoredValue(JSON.parse(item));
        }
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
    setIsLoaded(true);
  }, [key, expiryHours]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        }
        setIsExpired(false);
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(`${key}_timestamp`);
      }
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, isExpired];
}
