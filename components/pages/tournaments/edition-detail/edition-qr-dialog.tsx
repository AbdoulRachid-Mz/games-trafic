"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, QrCode, ScanLine, Share2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { QrScanner } from "@/components/shared/qr-scanner";
import { getAppUrlEnv } from "@/utils/app-url";
import { resolveEditionPathFromQR } from "@/utils/qr-utils";

interface EditionQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  editionId: string;
  editionLabel: string;
}

type QrTab = "share" | "scan";

export function EditionQrDialog({
  open,
  onOpenChange,
  tournamentId,
  editionId,
  editionLabel,
}: EditionQrDialogProps) {
  const router = useRouter();
  const [tab, setTab] = useState<QrTab>("share");

  // URL publique de l'édition : scannable par n'importe quel appareil.
  const editionUrl = useMemo(
    () => `${getAppUrlEnv()}/tournaments/${tournamentId}/editions/${editionId}?join=1`,
    [tournamentId, editionId],
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(editionUrl);
      toast.success("Lien de l'édition copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleScan = (raw: string) => {
    const path = resolveEditionPathFromQR(raw);

    if (!path) {
      toast.error("Ce QR code ne correspond pas à une édition");
      return;
    }

    toast.success("Édition reconnue, redirection…");
    onOpenChange(false);
    router.push(`${path}?join=1`);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Le scanner ne doit jamais rester actif en arrière-plan.
      setTab("share");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black italic tracking-tight">
            <QrCode className="h-5 w-5 text-primary" />
            Partager & rejoindre
          </DialogTitle>
          <DialogDescription>
            Faites scanner ce code QR pour rejoindre directement {editionLabel},
            ou scannez le code d&apos;une autre édition.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as QrTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" className="gap-2">
              <Share2 className="h-4 w-4" />
              Mon QR
            </TabsTrigger>
            <TabsTrigger value="scan" className="gap-2">
              <ScanLine className="h-4 w-4" />
              Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="mt-4 space-y-3">
            <div className="flex justify-center">
              <TransactionQRCode
                data={editionUrl}
                size={220}
                label={editionLabel}
                logoUrl="/logo.png"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="w-full gap-2"
            >
              <Copy className="h-4 w-4" />
              Copier le lien de l&apos;édition
            </Button>
          </TabsContent>

          <TabsContent value="scan" className="mt-4 space-y-3">
            <QrScanner
              active={open && tab === "scan"}
              onScan={handleScan}
              className="mx-auto w-full max-w-xs"
            />
            <p className="text-center text-xs text-muted-foreground">
              Placez le code QR de l&apos;édition dans le cadre pour la rejoindre
              immédiatement.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
