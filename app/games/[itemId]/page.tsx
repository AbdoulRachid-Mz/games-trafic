import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGameItemById } from "@/actions/games"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Typography } from "@/components/ui/typography"
import { TransactionQRCode } from "@/components/shared/qr-code"
import { encodeTransactionQR } from "@/utils/qr-utils"

interface PageProps {
  params: Promise<{ itemId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { itemId } = await params
  const item = await getGameItemById(itemId)
  return {
    title: item ? `${item.name} | Item de jeu` : "Item introuvable",
    description: item?.description || "Détails de l'item de jeu",
  }
}

export default async function GameItemPage({ params }: PageProps) {
  const { itemId } = await params
  const item = await getGameItemById(itemId)

  if (!item) {
    notFound()
  }

  const price = parseFloat(item.priceGtc || "0")

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="font-black italic uppercase tracking-tighter">{item.name}</span>
            <span className="text-sm font-bold">{price} GTC</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {item.description && (
            <Typography variant="body-base" className="text-muted-foreground">
              {item.description}
            </Typography>
          )}
          <div className="flex flex-col items-center gap-2">
            <Typography variant="h4" className="font-black italic uppercase tracking-tighter">
              Achat Direct
            </Typography>
            <Typography variant="caption1" theme="muted">
              Scannez pour acheter cet item
            </Typography>
            <TransactionQRCode
              data={encodeTransactionQR({
                t: "GAME_ITEM_PURCHASE",
                id: item.id,
                a: price,
                m: { name: item.name, gameId: item.gameId }
              })}
              label={item.name}
              className="shadow-none border-none p-0 bg-transparent"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
