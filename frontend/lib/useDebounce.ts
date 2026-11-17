import { useState, useEffect } from 'react';

/**
 * Hook untuk menunda (debounce) pembaruan nilai hingga delay (ms) berlalu
 * tanpa adanya perubahan baru.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
