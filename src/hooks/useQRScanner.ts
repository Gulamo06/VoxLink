import { useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const CONTAINER_ID = 'qr-scanner-container';

export function useQRScanner(onScan: (decodedText: string) => void, enabled: boolean) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled while running
      scannerRef.current?.clear().catch(() => undefined);
      scannerRef.current = null;
      return;
    }

    // Small delay to ensure the DOM container is rendered
    const timer = window.setTimeout(() => {
      const container = document.getElementById(CONTAINER_ID);
      if (!container) return;

      const config = { fps: 10, qrbox: { width: 280, height: 280 } };
      scannerRef.current = new Html5QrcodeScanner(CONTAINER_ID, config, false);

      scannerRef.current.render(
        (decodedText) => onScanRef.current(decodedText),
        (error) => console.debug('QR scan error', error)
      );
    }, 100);

    return () => {
      window.clearTimeout(timer);
      scannerRef.current?.clear().catch(() => undefined);
      scannerRef.current = null;
    };
  }, [enabled]);

  return { containerId: CONTAINER_ID };
}
