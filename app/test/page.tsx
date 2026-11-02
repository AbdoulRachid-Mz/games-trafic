import { Metadata } from "next";
import { QrTransaction } from "@/components/pages/transactions/qr-transaction";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PulseLoading } from "@/components/loading-ui/pulse-loader";
import MixBorder from "@/components/shared/mix-border";

export const metadata: Metadata = {
  title: "Scanner QR | Transactions",
  description: "Scanner un code QR pour effectuer une transaction",
};

export default async function WalletQrTransactionPage() {
  // const user = await getCurrentUser()
  // if (!user) {
  //   redirect("/sign-in")
  // }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-[400px] h-[250px] rounded-2xl bg-transparent overflow-hidden">
          <MixBorder
            radius={20}
            top={{
              show: true,
              thickness: 3,
              size: "100%",
              colors: {
                first: {
                  color: "--primary",
                  size: "50%",
                  order: 1,
                },

                second: {
                  color: "--secondary",
                  size: "50%",
                  order: 2,
                },
              },
            }}
            bottom={{
              show: true,
              thickness: 3,
              colors: {
                first: {
                  color: "--primary",
                  size: "50%",
                  order: 1,
                },
                second: {
                  color: "--secondary",
                  size: "50%",
                  order: 2,
                },
              },
            }}
            left={{
              show: true,
              thickness: 3,
              size: "100%",
              colors: {
                one: {
                  color: "--primary",
                  size: "100%",
                  order: 1,
                },
              },
            }}
            right={{
              show: true,
              thickness: 3,
              size: "100%",
              colors: {
                one: {
                  color: "--secondary",
                  size: "100%",
                  order: 1,
                },
              },
            }}
            className="-z-10"
          />

          <div className="p-10 ">
            {/* contenu */}
          </div>
        </div>
      </div>
    </>
    // <div className="mx-auto px-4">
    //   <div className="text-center mb-6">
    //     <Typography variant="h2" weight="bold" className="font-black italic uppercase tracking-tighter">
    //       Scanner un QR
    //     </Typography>
    //     <Typography variant="body-sm" theme="muted">
    //       Utilisez votre appareil pour scanner et payer
    //     </Typography>
    //   </div>
    //   <Card className="max-w-2xl mx-auto">
    //     <CardContent className="p-6">
    //       <QrTransaction />
    //     </CardContent>
    //   </Card>
    // </div>
  );
}
