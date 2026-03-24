// components/shared/qr-scanner.tsx (réécriture complète)
"use client";

import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Camera, CameraOff, RefreshCw } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface QrScannerProps {
  onScan: (data: string) => void;
  className?: string;
  active?: boolean;
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export function QrScanner({ 
  onScan, 
  className, 
  active = true,
  onError,
  onStart,
  onStop
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanCallbackRef = useRef<(data: string) => void>(() => {});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [laserActive, setLaserActive] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    scanCallbackRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();

    const startScanner = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setScanSuccess(false);

        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (!devices.length) {
          throw new Error("Aucune caméra trouvée");
        }

        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("arrière")
        ) ?? devices[0];

        const controls = await reader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current!,
          (result) => {
            if (result) {
              setLaserActive(true);
              setScanSuccess(true);
              scanCallbackRef.current?.(result.getText());

              // Animation de succès puis arrêt
              setTimeout(() => {
                controlsRef.current?.stop();
                controlsRef.current = null;
                setIsScanning(false);
                setLaserActive(false);
                onStop?.();
              }, 800);
            }
          }
        );

        controlsRef.current = controls;
        setIsScanning(true);
        setIsLoading(false);
        onStart?.();
      } catch (err: any) {
        console.error("QR Scanner Error:", err);
        const errorMsg = err.message ?? "Erreur caméra";
        setError(errorMsg);
        onError?.(errorMsg);
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
  }, [active, onError, onStart, onStop]);

  return (
    <div className={cn(
      "relative aspect-square overflow-hidden rounded-3xl bg-black shadow-2xl",
      className
    )}>
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
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            style={{
              clipPath: 'polygon(0% 0%, 0% 100%, 15% 100%, 15% 15%, 85% 15%, 85% 85%, 15% 85%, 15% 100%, 100% 100%, 100% 0%)'
            }}
          />

          {/* Frame Corners */}
          <div className={cn(
            "absolute top-[15%] left-[15%] w-10 h-10 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300",
            scanSuccess ? "border-green-500" : "border-primary"
          )} />
          <div className={cn(
            "absolute top-[15%] right-[15%] w-10 h-10 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300",
            scanSuccess ? "border-green-500" : "border-primary"
          )} />
          <div className={cn(
            "absolute bottom-[15%] left-[15%] w-10 h-10 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300",
            scanSuccess ? "border-green-500" : "border-primary"
          )} />
          <div className={cn(
            "absolute bottom-[15%] right-[15%] w-10 h-10 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300",
            scanSuccess ? "border-green-500" : "border-primary"
          )} />

          {/* Scanning Line Animation */}
          <motion.div
            animate={{
              y: scanSuccess ? ["0%", "100%"] : ["0%", "100%"],
              opacity: scanSuccess ? [1, 0] : [0.8, 0.4]
            }}
            transition={{
              duration: 2,
              repeat: scanSuccess ? 0 : Infinity,
              ease: "linear"
            }}
            className={cn(
              "absolute top-[15%] left-[15%] right-[15%] h-0.5 shadow-lg",
              scanSuccess 
                ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]" 
                : "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]"
            )}
          />

          {/* Success Flash Effect */}
          <AnimatePresence>
            {scanSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-green-500/40"
              />
            )}
          </AnimatePresence>

          {/* Status Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <div className={cn(
              "px-4 py-1.5 backdrop-blur-md rounded-full border transition-colors duration-300",
              scanSuccess 
                ? "bg-green-500/20 border-green-500/30"
                : "bg-primary/20 border-primary/30"
            )}>
              <Typography variant="caption1" className={cn(
                "font-bold tracking-widest uppercase",
                scanSuccess ? "text-green-500" : "text-primary"
              )}>
                {scanSuccess ? "Scan réussi !" : "Scan en cours..."}
              </Typography>
            </div>
          </motion.div>
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

      {/* Camera Icon Overlay */}
      {!isLoading && !error && isScanning && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 pointer-events-none"
        >
          <Camera className="h-4 w-4 text-white/60" />
        </motion.div>
      )}
    </div>
  );
}