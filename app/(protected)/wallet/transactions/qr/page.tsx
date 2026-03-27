import { Metadata } from "next"
import { QrTransaction } from "@/components/transactions/qr-transaction"
import { Typography } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentUser, getCurrentUser2 } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Scanner QR | Transactions",
  description: "Scanner un code QR pour effectuer une transaction",
}

export default async function WalletQrTransactionPage() {
  const user = await getCurrentUser2(await headers())
  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="mx-auto px-4">
      <div className="text-center mb-6">
        <Typography variant="h2" weight="bold" className="font-black italic uppercase tracking-tighter">
          Scanner un QR
        </Typography>
        <Typography variant="body-sm" theme="muted">
          Utilisez votre appareil pour scanner et payer
        </Typography>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <QrTransaction />
        </CardContent>
      </Card>
    </div>
  )
}
