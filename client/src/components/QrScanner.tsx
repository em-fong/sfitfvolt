import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface QrScannerProps {
  onScan: (result: string | null) => void;
}

export default function QrScanner({ onScan }: QrScannerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // Mock QR code scan for demo - in a real app this would use the device camera
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }

    // Request camera permissions
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
        setIsLoading(false);
        
        // Simulate a scan after 3 seconds
        const timer = setTimeout(() => {
          // This is a mock QR code scan that would happen in a real app
          onScan("volunteer-qr-code-12345");
        }, 3000);
        
        return () => clearTimeout(timer);
      })
      .catch((error) => {
        console.error("Camera permission error:", error);
        setIsLoading(false);
        toast({
          title: "Camera Permission Error",
          description: "Please allow camera access to scan QR codes.",
          variant: "destructive",
        });
      });
  }, [isMounted, onScan]);

  if (isLoading) {
    return (
      <div className="qr-scanner-container relative">
        <div className="qr-scanner-mock relative w-[250px] h-[250px] border-2 border-white mx-auto flex items-center justify-center">
          <div className="text-white">Loading camera...</div>
          <div className="scan-line absolute top-0 w-full h-[2px] bg-primary-500 animate-[scanline_2s_infinite]"></div>
        </div>
      </div>
    );
  }
  
  if (!hasPermission) {
    return (
      <div className="qr-scanner-container">
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          <p className="text-center">Camera access denied. Please enable camera permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container relative">
      <div className="qr-scanner-mock relative w-[250px] h-[250px] border-2 border-white mx-auto 
                     animate-[scan_2s_infinite] shadow-[0_0_0_0_rgba(59,130,246,0.5)]">
        <div className="scan-line absolute top-0 w-full h-[2px] bg-primary-500 animate-[scanline_2s_infinite]"></div>
      </div>
    </div>
  );
}
