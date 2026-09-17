"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({
  onScanSuccess,
  onScanFailure,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for camera permissions early to provide better UX
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
      })
      .catch(() => {
        setHasPermission(false);
      });

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
        aspectRatio: 1,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Debounce or directly call success
        onScanSuccess(decodedText);
      },
      (error) => {
        if (onScanFailure) {
          onScanFailure(error);
        }
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {hasPermission === false && (
        <div className="text-red-500 font-medium mb-4 text-center">
          Camera permissions were denied. Please enable them in your browser settings to scan packages.
        </div>
      )}
      <div 
        id="qr-reader" 
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-inner border-2 border-indigo-500/30"
      ></div>
      {/* Some custom CSS to override html5-qrcode's ugly default styles */}
      <style dangerouslySetInnerHTML={{__html: `
        #qr-reader { border: none !important; }
        #qr-reader img { display: none !important; }
        #qr-reader__scan_region { min-height: 250px; background: #0f172a; position: relative; }
        #qr-reader__scan_region video { object-fit: cover !important; border-radius: 1rem; }
        #qr-reader__dashboard { padding: 1rem; background: #1e293b; color: white; border-radius: 0 0 1rem 1rem; }
        #qr-reader button { background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; margin: 4px; }
        #qr-reader button:hover { background: #4338ca; }
        #qr-reader__camera_selection { background: #0f172a; color: white; border: 1px solid #334155; padding: 8px; border-radius: 8px; width: 100%; margin-bottom: 8px; }
        #qr-reader__dashboard_section_csr span { color: #94a3b8 !important; font-size: 12px; }
      `}} />
    </div>
  );
};

export default QrScanner;
