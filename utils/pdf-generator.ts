import { jsPDF } from "jspdf";

interface ReceiptData {
  transactionId: string;
  amount: number;
  type: string;
  fees: number;
  totalAmount: number;
  date: Date;
  reference: string;
  newBalance: number;
  entityData?: any;
}

export function generateTransactionReceipt(data: ReceiptData) {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(20);
  doc.text("GAMES TRAFICS", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("Reçu de transaction", 105, 30, { align: "center" });
  
  // Ligne de séparation
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  // Informations de la transaction
  doc.setFontSize(10);
  let yPos = 45;
  
  doc.text(`Référence: ${data.reference}`, 20, yPos);
  yPos += 8;
  doc.text(`Date: ${data.date.toLocaleString("fr-FR")}`, 20, yPos);
  yPos += 8;
  doc.text(`Type: ${getTransactionLabel(data.type)}`, 20, yPos);
  yPos += 8;
  
  if (data.entityData?.name) {
    doc.text(`Élément: ${data.entityData.name}`, 20, yPos);
    yPos += 8;
  }
  // Détails spécifiques par type
  if (data.type === "TOURNAMENT_PARTICIPATION") {
    if (data.entityData?.metadata?.editionNumber) {
      doc.text(
        `Édition: #${data.entityData.metadata.editionNumber}`,
        20,
        yPos
      );
      yPos += 8;
    }
    if (data.entityData?.metadata?.tournamentId) {
      doc.text(
        `Tournoi ID: ${data.entityData.metadata.tournamentId}`,
        20,
        yPos
      );
      yPos += 8;
    }
  }
  
  doc.text("", 20, yPos); // Espace
  
  // Détails financiers
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAILS FINANCIERS", 20, yPos);
  doc.setFont("helvetica", "normal");
  
  yPos += 10;
  doc.text(`Montant: ${data.amount.toFixed(2)} GTC`, 30, yPos);
  
  yPos += 7;
  doc.text(`Frais: ${data.fees.toFixed(2)} GTC`, 30, yPos);
  
  yPos += 7;
  doc.text(`Total: ${data.totalAmount.toFixed(2)} GTC`, 30, yPos);
  
  yPos += 12;
  // Retiré: affichage du nouveau solde sur le reçu
  
  // Pied de page
  doc.setLineWidth(0.5);
  doc.line(20, 250, 190, 250);
  
  doc.setFontSize(9);
  doc.text("Merci pour votre confiance !", 105, 258, { align: "center" });
  doc.text("support@gamestrafics.com", 105, 263, { align: "center" });
  doc.text("Tahoua - Niger", 105, 268, { align: "center" });
  
  // Enregistrer le PDF
  doc.save(`receipt-${data.reference}.pdf`);
}

function getTransactionLabel(type: string): string {
  const labels: Record<string, string> = {
    THEME_PURCHASE: "Achat de thème",
    VIP_SUBSCRIPTION: "Abonnement VIP",
    PRODUCT_PURCHASE: "Achat de produit",
    TOURNAMENT_PARTICIPATION: "Participation tournoi",
    GAME_ITEM_PURCHASE: "Achat d'item de jeu",
    DEPOSIT: "Dépôt",
    WITHDRAWAL: "Retrait",
    TRANSFER: "Transfert",
  };
  return labels[type] || type;
}
