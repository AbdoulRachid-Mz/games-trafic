// import { getEditionRegistrations, getRegistrationPayments } from "@/actions/tournanents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getEditionRegistrations, updateEditionRegistration, updateRegistrationPayment, getTournamentEditions } from "@/actions/tournaments";
import { refundTransaction } from "@/actions/transactions";
import {
  EditionRegistration,
  TournamentMember,
  RegistrationPayment,
  WalletTransaction,
} from "@/database/schema";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

type RegistrationWithPayment = EditionRegistration & {
  member: TournamentMember;
  payment:
  | (RegistrationPayment & {
    transaction?: WalletTransaction;
  })
  | null;
};

export default async function DashboardPaymentsPage({ params }: PageProps) {
  const { editionId } = await params;

  const editionRes = await getTournamentEditions({
    filters: { id: editionId } as any,
    pagination: { page: 1, limit: 1 },
    options: { includeDeleted: false, includeInactive: false },
  });
  const edition = editionRes.data?.[0] as any;
  const isPayingEdition = !!edition && parseFloat(edition.entryFee || "0") > 0;

  const registrationsResponse = await getEditionRegistrations({
    filters: { editionId },
    pagination: { limit: 100, page: 1 },
    options: {
      populate: ["member", "payment", "payment.transaction"],
      sortBy: "registeredAt",
      sortOrder: "desc",
    },
  });

  const registrations = registrationsResponse.data as RegistrationWithPayment[];

  // Filter for those who have a payment record
  const payments = registrations
    .filter((reg) => reg.payment !== null)
    .map((reg) => ({
      ...reg.payment!,
      registration: reg,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Paiements</CardTitle>
        <CardDescription>
          Paiements liés aux inscriptions pour cette édition.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isPayingEdition && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Édition non payante</AlertTitle>
            <AlertDescription>
              Cette édition ne nécessite aucun paiement. Aucune action d'approbation/rejet n'est requise.
            </AlertDescription>
          </Alert>
        )}
        {payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun paiement enregistré pour le moment.</p>
            <p className="text-sm">
              Les paiements apparaîtront ici une fois les inscriptions
              confirmées.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Transaction ID</TableHead>
                {isPayingEdition && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.registration.member.displayName || "Joueur"}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">
                      {payment.amount} {payment.currency}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === "COMPLETED"
                          ? "default"
                          : payment.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                      }
                      className="font-normal"
                    >
                      {payment.status === "COMPLETED"
                        ? "Complété"
                        : payment.status === "PENDING"
                          ? "En attente"
                          : payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.paidAt || payment.createdAt ? (
                      format(
                        new Date((payment.paidAt || payment.createdAt)!),
                        "d MMM yyyy HH:mm",
                        {
                          locale: fr,
                        }
                      )
                    ) : (
                      <span className="italic">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                    {payment.transactionId?.substring(0, 18)}...
                  </TableCell>
                  {isPayingEdition && (
                    <TableCell className="text-right">
                      {payment.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <form
                            action={async () => {
                              "use server";
                              await updateRegistrationPayment(payment.id, {
                                status: "COMPLETED",
                                paidAt: new Date(),
                              } as any);
                              await updateEditionRegistration(payment.registration.id, {
                                feePaid: true,
                                status: "REGISTERED",
                              } as any);
                            }}
                          >
                            <button className="px-3 py-2 rounded-md bg-green-600 text-white text-xs">
                              Approuver
                            </button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              if (payment.transactionId) {
                                await refundTransaction(payment.transactionId, "Inscription rejetée");
                              }
                              await updateRegistrationPayment(payment.id, {
                                status: "REFUNDED",
                                notes: "Rejet par l'organisateur",
                              } as any);
                              await updateEditionRegistration(payment.registration.id, {
                                status: "CANCELLED",
                              } as any);
                            }}
                          >
                            <button className="px-3 py-2 rounded-md bg-red-600 text-white text-xs">
                              Rejeter
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
