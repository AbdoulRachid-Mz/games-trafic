"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrScanner } from "@/components/shared/qr-scanner";
import { decodeTransactionQR, isValidTransactionQR } from "@/utils/qr-utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function QrTransaction() {
  const router = useRouter();
  const [scanningEnabled, setScanningEnabled] = useState(true);

  const handleScan = async (data: string) => {
    try {
      const decoded = decodeTransactionQR(data);
      if (!decoded || !isValidTransactionQR(decoded)) {
        toast.error("QR non pris en charge");
        return;
      }
      setScanningEnabled(false);
      const params = new URLSearchParams();
      params.set("type", decoded.t);
      params.set("entityId", decoded.id);
      params.set("image", decoded.i || "")
      if (typeof decoded.a === "number") {
        params.set("amount", decoded.a.toString());
      }
      // router.push(`/wallet/transactions/create?${params.toString()}`);
    } catch {
      toast.error("QR invalide");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Typography variant="h3" weight="bold">
          Scanner un QR
        </Typography>
        <Typography variant="body-base" theme="muted">
          Scannez pour préparer la transaction
        </Typography>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <QrScanner onScan={handleScan} active={scanningEnabled} />
          <div className="text-center">
            <Typography variant="caption1" theme="muted">
              Placez le QR dans le cadre
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 rounded-xl" onClick={() => setScanningEnabled(false)}>
              Arrêter
            </Button>
            <Button variant="secondary" className="h-10 rounded-xl" onClick={() => setScanningEnabled(true)}>
              Relancer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
