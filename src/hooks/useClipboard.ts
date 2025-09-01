import { useState, useCallback } from 'react';

// Hook to manage clipboard operations
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  // Copy text to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      console.error('Copy error:', error);
      return false;
    }
  }, []);

  return { copied, copyToClipboard };
}