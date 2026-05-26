import { useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

const CONTAINER_ID = 'qr-scanner-container';

export function useQRScanner(onScan: (decodedText: string) => void, enabled: boolean) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const onScanRef = useRef(onScan);
  const scannedRef = useRef(false);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled while running
      scannerRef.current?.clear().catch(() => undefined);
      scannerRef.current = null;
      scannedRef.current = false;
      return;
    }

    // Small delay to ensure the DOM container is rendered
    const timer = window.setTimeout(() => {
      const container = document.getElementById(CONTAINER_ID);
      if (!container) return;

      // Optimized config for mobile with rear camera
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const config = { 
        fps: 15, 
        qrbox: { width: isMobile ? 250 : 280, height: isMobile ? 250 : 280 },
        aspectRatio: 1.0,
        disableFlip: false,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true
      };
      
      scannerRef.current = new Html5QrcodeScanner(CONTAINER_ID, config, false);

      scannerRef.current.render(
        (decodedText) => {
          // Prevent multiple scans of the same code
          if (!scannedRef.current) {
            scannedRef.current = true;
            onScanRef.current(decodedText);
            // Allow scanning again after 2 seconds
            setTimeout(() => {
              scannedRef.current = false;
            }, 2000);
          }
        },
        (error) => console.debug('QR scan error', error)
      );
    }, 100);

    return () => {
      window.clearTimeout(timer);
      scannerRef.current?.clear().catch(() => undefined);
      scannerRef.current = null;
      scannedRef.current = false;
    };
  }, [enabled]);

  return { containerId: CONTAINER_ID };
}
