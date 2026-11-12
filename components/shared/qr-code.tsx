// components/shared/qr-code.tsx
"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TransactionQRCodeProps {
  data: string;
  size?: number;
  label?: string;
  className?: string;
  withLogo?: boolean;
  logoUrl?: string;
}

export function TransactionQRCode({
  data,
  size = 200,
  label,
  className,
  withLogo = true,
  logoUrl,
}: TransactionQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);

        // Options de base du QR code
        const options: QRCode.QRCodeOptions = {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        };

        let url = await QRCode.toDataURL(data, options);

        // Ajouter le logo si demandé
        if (withLogo && (logoUrl || "/logo.png")) {
          url = await addLogoToQR(url, logoUrl || "/logo.png", size);
        }

        setQrUrl(url);
      } catch (err) {
        console.error("QR Generation error", err);
      } finally {
        setIsLoading(false);
      }
    };
    generateQR();
  }, [data, size, withLogo, logoUrl]);

  const addLogoToQR = async (qrDataUrl: string, logoPath: string, size: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const qrImage = new Image();
      const logoImage = new Image();

      canvas.width = size;
      canvas.height = size;

      qrImage.onload = () => {
        logoImage.onload = () => {
          if (!ctx) return;
          ctx.drawImage(qrImage, 0, 0, size, size);

          // Taille du logo (20% du QR)
          const logoSize = size * 0.2;
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;

          // Fond blanc pour le logo
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

          // Arrondir les coins du fond
          ctx.beginPath();
          ctx.roundRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10, 8);
          ctx.fill();

          // Dessiner le logo
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

          resolve(canvas.toDataURL());
        };
        logoImage.onerror = () => {
          // Si le logo ne charge pas, retourner le QR sans logo
          resolve(qrDataUrl);
        };
        logoImage.src = logoPath;
      };
      qrImage.onerror = reject;
      qrImage.src = qrDataUrl;
    });
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `gt-transaction-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code téléchargé");
  };

  return (
    <div className={cn(
      "flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-black/5 animate-in fade-in zoom-in duration-500",
      className
    )}>
      <div className="relative group">
        <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
        <div className="relative bg-white p-4 rounded-2xl border-2 border-slate-100 overflow-hidden min-w-[120px] min-h-[120px] flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <img src={qrUrl} alt="QR Code" className="w-full h-auto" />
          )}
        </div>
      </div>

      {label && (
        <div className="text-center space-y-1">
          <Typography variant="caption1" className="text-slate-500 font-bold uppercase tracking-widest">
            {label}
          </Typography>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-9"
        >
          <Download className="h-3.5 w-3.5 mr-2" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

// Helper pour arrondir les rectangles (client uniquement : jamais exécuté en SSR)
if (
  typeof window !== "undefined" &&
  !(window as any).CanvasRenderingContext2D.prototype.roundRect
) {
  (window as any).CanvasRenderingContext2D.prototype.roundRect = function (x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
  };
}