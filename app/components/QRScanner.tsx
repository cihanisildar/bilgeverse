'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  buttonClassName?: string;
  scannerClassName?: string;
}

export default function QRScanner({
  onScan,
  onError,
  buttonText = 'QR Kod Tarayıcıyı Başlat',
  buttonClassName = 'w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50',
  scannerClassName = 'w-full min-h-[300px]',
}: QRScannerProps) {
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      setScannerActive(true);

      // Wait for the element to be in the DOM
      await new Promise<void>((resolve) => {
        const checkElement = () => {
          const element = document.getElementById('qr-reader');
          if (element) {
            resolve();
          } else {
            setTimeout(checkElement, 50);
          }
        };
        checkElement();
      });

      // Small delay to ensure element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const scanner = new Html5Qrcode('qr-reader');
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log('QR Code scanned:', decodedText);
          scanner.stop().catch(console.error);
          setScannerActive(false);
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
          console.debug('Scanning...', errorMessage);
        }
      );
      scannerRef.current = scanner;
    } catch (err) {
      const errorMsg = 'Kamera erişimi başarısız oldu. Lütfen kamera izinlerini kontrol edin.';
      console.error('Scanner error:', err);
      setScannerActive(false);
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setScannerActive(false);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, []);

  if (!scannerActive) {
    return (
      <Button
        onClick={startScanner}
        variant="outline"
        className={buttonClassName}
      >
        <Camera className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700 text-center mb-2">QR Kod Tarayıcı</p>
      <div id="qr-reader" className={scannerClassName}></div>
      <Button
        onClick={stopScanner}
        variant="outline"
        className="w-full"
      >
        Taramayı Durdur
      </Button>
    </div>
  );
}
