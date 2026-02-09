"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { Download, Share2, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TransactionQRCodeProps {
  data: string;
  size?: number;
  label?: string;
  className?: string;
}

export function TransactionQRCode({
  data,
  size = 200,
  label,
  className,
}: TransactionQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);
        const url = await QRCode.toDataURL(data, {
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        });
        setQrUrl(url);
      } catch (err) {
        console.error("QR Generation error", err);
      } finally {
        setIsLoading(false);
      }
    };
    generateQR();
  }, [data, size]);

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
    <div className={cn("flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-black/5 animate-in fade-in zoom-in duration-500", className)}>
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

export function QRCodeSimple({ data, size = 128, className }: { data: string; size?: number; className?: string }) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(data, { width: size, margin: 1 }).then(setQrUrl);
  }, [data, size]);

  return (
    <div className={cn("bg-white p-2 rounded-xl border border-slate-100 shadow-sm", className)}>
      <img src={qrUrl} alt="QR" className="w-full h-auto block" />
    </div>
  );
}
