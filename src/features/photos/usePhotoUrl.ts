import { useState, useEffect } from 'react';

/**
 * Custom hook to safely manage URL.createObjectURL and URL.revokeObjectURL
 * preventing memory leaks and dangling blob URLs in the browser.
 */
export function usePhotoUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}
