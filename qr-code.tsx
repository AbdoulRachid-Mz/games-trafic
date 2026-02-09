"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Typography } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Download, Copy, Share2, Check } from "lucide-react"
import { toast } from "sonner"
import QRCode from "qrcode"

interface QRCodeDisplayProps {
  // Données à encoder
  data: string | object

  // Options d'affichage
  size?: number
  margin?: number
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"

  // Style
  foregroundColor?: string
  backgroundColor?: string
  className?: string

  // Options de carte
  showCard?: boolean
  title?: string
  description?: string

  // Actions
  showActions?: boolean
  onDownload?: () => void
  onCopy?: () => void
  onShare?: () => void
}

export function QRCodeDisplay({
  data,
  size = 200,
  margin = 2,
  errorCorrectionLevel = "M",
  foregroundColor = "#000000",
  backgroundColor = "#ffffff",
  className,
  showCard = true,
  title,
  description,
  showActions = true,
  onDownload,
  onCopy,
  onShare,
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const dataString = typeof data === "string" ? data : JSON.stringify(data)

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(dataString, {
          width: size,
          margin,
          errorCorrectionLevel,
          color: {
            dark: foregroundColor,
            light: backgroundColor,
          },
        })
        setQrDataUrl(url)
      } catch (err) {
        console.error("Error generating QR code:", err)
        toast.error("Erreur lors de la génération du QR code")
      }
    }

    generateQR()
  }, [dataString, size, margin, errorCorrectionLevel, foregroundColor, backgroundColor])

  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement("a")
    link.href = qrDataUrl
    link.download = `qrcode-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("QR Code téléchargé")
    onDownload?.()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dataString)
      setCopied(true)
      toast.success("Données copiées")
      setTimeout(() => setCopied(false), 2000)
      onCopy?.()
    } catch (err) {
      toast.error("Erreur lors de la copie")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "QR Code",
          text: dataString,
        })
        onShare?.()
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopy()
    }
  }

  const qrContent = (
    <div className="flex flex-col items-center gap-4">
      {(title || description) && (
        <div className="text-center space-y-1">
          {title && (
            <Typography variant="h6" weight="semibold">
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body-sm" theme="muted">
              {description}
            </Typography>
          )}
        </div>
      )}

      {qrDataUrl && (
        <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
          <img
            src={qrDataUrl || "/placeholder.svg"}
            alt="QR Code"
            className="w-full h-auto"
            style={{ maxWidth: size }}
          />
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={!qrDataUrl}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </>
            )}
          </Button>

          {typeof navigator.share === "function" && (
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (showCard) {
    return (
      <Card className={cn("w-fit", className)}>
        <CardContent className="pt-6">{qrContent}</CardContent>
      </Card>
    )
  }

  return <div className={cn("w-fit", className)}>{qrContent}</div>
}

// Composant simplifié pour afficher juste le QR code
export function QRCodeSimple({
  data,
  size = 128,
  className,
}: {
  data: string | object
  size?: number
  className?: string
}) {
  return <QRCodeDisplay data={data} size={size} showCard={false} showActions={false} className={className} />
}
