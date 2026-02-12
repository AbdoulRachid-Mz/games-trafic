"use client";

import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Camera, CameraOff, RefreshCw } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

export function QrScanner({
  onScan,
  className,
  active = true,
}: {
  onScan: (data: string) => void;
  className?: string;
  active?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanCallbackRef = useRef<(data: string) => void>(() => {});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    scanCallbackRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();

    const startScanner = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (!devices.length) {
          throw new Error("Aucune caméra trouvée");
        }

        const backCamera =
          devices.find(d =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("arrière")
          ) ?? devices[0];

        const controls = await reader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current!,
          (result) => {
            if (result) {
              scanCallbackRef.current?.(result.getText());

              // ✅ arrêt propre du scanner
              controlsRef.current?.stop();
              controlsRef.current = null;

              setIsScanning(false);
            }
          }
        );

        controlsRef.current = controls;
        setIsScanning(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error("QR Scanner Error:", err);
        setError(err.message ?? "Erreur caméra");
        setIsLoading(false);
      }
    };

    if (active) {
      startScanner();
    } else {
      if (isScanning) {
        controlsRef.current?.stop();
        controlsRef.current = null;
        setIsScanning(false);
      }
    }

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [active]);

    return (
        <div className={cn("relative aspect-square overflow-hidden rounded-3xl border-2 border-primary/20 bg-black shadow-2xl", className)}>
            {/* Video Stream */}
            <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
            />

            {/* Overlay: Scanning Frame */}
            {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                    {/* Darker area outside frame */}
                    <div className="absolute inset-0 bg-black/40" style={{
                        clipPath: 'polygon(0% 0%, 0% 100%, 15% 100%, 15% 15%, 85% 15%, 85% 85%, 15% 85%, 15% 100%, 100% 100%, 100% 0%)'
                    }} />

                    {/* Frame Corners */}
                    <div className="absolute top-[15%] left-[15%] w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                    <div className="absolute top-[15%] right-[15%] w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                    <div className="absolute bottom-[15%] left-[15%] w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                    <div className="absolute bottom-[15%] right-[15%] w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl" />

                    {/* Scanning Line Animation */}
                    <div className="absolute top-[15%] left-[15%] right-[15%] h-1 bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-scan-line" />

                    {/* Status Badge */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30">
                        <Typography variant="caption1" className="text-primary font-bold tracking-widest uppercase">
                            Scan en cours...
                        </Typography>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <Typography variant="body-sm" className="text-white/60 font-medium">
                        Initialisation de la caméra...
                    </Typography>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center z-30">
                    <div className="h-16 w-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
                        <CameraOff className="h-8 w-8 text-red-500" />
                    </div>
                    <Typography variant="body-base" className="text-white font-bold mb-2">
                        Caméra indisponible
                    </Typography>
                    <Typography variant="caption1" className="text-white/40 mb-6">
                        {error}
                    </Typography>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-white hover:bg-white/10"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Réessayer
                    </Button>
                </div>
            )}

            {/* Camera Icon Overlay (Floating) */}
            {!isLoading && !error && (
                <div className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 pointer-events-none">
                    <Camera className="h-4 w-4 text-white/60" />
                </div>
            )}
        </div>
    );
}
