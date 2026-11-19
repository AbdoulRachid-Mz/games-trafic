import { getProductById } from "@/actions/products";
import { db } from "@/lib/db";
import { orders, walletTransactions } from "@/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { ProductSettingsForm } from "@/components/pages/marketplace/product-settings-form";
import { decryptData } from "@/lib/encryption";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductSettingsPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) notFound();

  const decryptedPassword = product.encryptedPassword
    ? decryptData(product.encryptedPassword)
    : "";

  const productOrders = await db.query.orders.findMany({
    where: and(eq(orders.productId, productId)),
    columns: {
      id: true,
      status: true,
      walletTransactionId: true,
    },
  });

  const walletTxIds = productOrders
    .map((o) => o.walletTransactionId)
    .filter((id): id is string => Boolean(id));

  let completedLinkedTransactions = 0;
  if (walletTxIds.length > 0) {
    const txs = await db
      .select({ id: walletTransactions.id })
      .from(walletTransactions)
      .where(
        and(
          inArray(walletTransactions.id, walletTxIds),
          eq(walletTransactions.status, "COMPLETED")
        )
      );
    completedLinkedTransactions = txs.length;
  }

  const hasCompletedOrder = productOrders.some((o) => o.status === "COMPLETED");
  const isSold = product.status === "VENDU";
  const isPaid = hasCompletedOrder || completedLinkedTransactions > 0;
  const isLocked = isSold || isPaid;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Typography variant="h2" weight="bold" className="tracking-tight italic uppercase">
            Paramètres du produit
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-1">
            Gérez les informations du produit, du compte et la visibilité.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPaid && (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Payé
            </Badge>
          )}
          {isSold && (
            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Vendu
            </Badge>
          )}
          {!isLocked && (
            <Badge variant="secondary">Modifiable</Badge>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          Ce produit est marqué comme vendu/payé (commande complétée, transaction liée complétée ou statut VENDU).
          Les informations critiques sont verrouillées pour préserver l'historique des commandes.
        </div>
      )}

      <ProductSettingsForm
        product={product}
        decryptedPassword={decryptedPassword}
        isLocked={isLocked}
        lockReason={{
          sold: isSold,
          paid: isPaid,
          completedOrders: productOrders.filter((o) => o.status === "COMPLETED").length,
          completedTransactions: completedLinkedTransactions,
        }}
      />
    </div>
  );
}
