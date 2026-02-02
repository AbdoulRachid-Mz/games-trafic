import { jsPDF } from "jspdf";
import { TransactionType, TransactionEntity } from "@/types/transaction-types";

interface ReceiptData {
  transactionId: string;
  amount: number;
  type: TransactionType;
  fees: number;
  totalAmount: number;
  date: Date;
  reference: string;
  newBalance: number;
  entityData?: TransactionEntity;
  metadata?: Record<string, any>;
}

interface ReceiptTemplate {
  generate: (doc: jsPDF, data: ReceiptData) => void;
}

const templates: Record<TransactionType, ReceiptTemplate> = {
  // Template pour les achats
  THEME_PURCHASE: {
    generate: (doc, data) => {
      addPurchaseDetails(doc, data, "Thème");
    }
  },
  PRODUCT_PURCHASE: {
    generate: (doc, data) => {
      addPurchaseDetails(doc, data, "Produit");
    }
  },
  GAME_ITEM_PURCHASE: {
    generate: (doc, data) => {
      addPurchaseDetails(doc, data, "Item de jeu");
    }
  },
  // Template pour abonnement
  VIP_SUBSCRIPTION: {
    generate: (doc, data) => {
      doc.setFontSize(11);
      doc.text("Type d'abonnement: VIP", 20, 90);
      doc.text("Durée: 30 jours", 20, 100);
      doc.text("Bénéfices inclus:", 20, 110);
      doc.text("- Thèmes illimités", 30, 120);
      doc.text("- Boutiques multiples", 30, 130);
      doc.text("- Support prioritaire", 30, 140);
    }
  },
  // Template pour tournoi
  TOURNAMENT_PARTICIPATION: {
    generate: (doc, data) => {
      doc.setFontSize(11);
      doc.text("Tournoi:", 20, 90);
      if (data.entityData?.name) {
        doc.text(`Nom: ${data.entityData.name}`, 30, 100);
      }
      if (data.metadata?.tournamentDate) {
        doc.text(`Date: ${new Date(data.metadata.tournamentDate).toLocaleDateString()}`, 30, 110);
      }
      if (data.metadata?.prizePool) {
        doc.text(`Prize pool: ${data.metadata.prizePool} GTC`, 30, 120);
      }
    }
  },
  // Template pour transfert
  TRANSFER: {
    generate: (doc, data) => {
      doc.setFontSize(11);
      doc.text("Type: Transfert entre utilisateurs", 20, 90);
      if (data.metadata?.recipientName) {
        doc.text(`Destinataire: ${data.metadata.recipientName}`, 20, 100);
      }
      if (data.metadata?.recipientWalletId) {
        doc.text(`Wallet: ${data.metadata.recipientWalletId}`, 20, 110);
      }
      if (data.metadata?.description) {
        doc.text(`Motif: ${data.metadata.description}`, 20, 120);
      }
    }
  },
  // Template pour dépôt
  DEPOSIT: {
    generate: (doc, data) => {
      doc.setFontSize(11);
      doc.text("Type: Dépôt de fonds", 20, 90);
      if (data.metadata?.paymentMethod) {
        doc.text(`Méthode: ${data.metadata.paymentMethod}`, 20, 100);
      }
      if (data.metadata?.paymentProvider) {
        doc.text(`Fournisseur: ${data.metadata.paymentProvider}`, 20, 110);
      }
      if (data.metadata?.paymentReference) {
        doc.text(`Référence: ${data.metadata.paymentReference}`, 20, 120);
      }
      doc.text("Statut: En attente de validation", 20, 130);
    }
  },
  // Template pour retrait
  WITHDRAWAL: {
    generate: (doc, data) => {
      doc.setFontSize(11);
      doc.text("Type: Retrait de fonds", 20, 90);
      if (data.metadata?.paymentMethod) {
        doc.text(`Méthode: ${data.metadata.paymentMethod}`, 20, 100);
      }
      if (data.metadata?.paymentProvider) {
        doc.text(`Fournisseur: ${data.metadata.paymentProvider}`, 20, 110);
      }
      if (data.metadata?.paymentAccountId) {
        doc.text(`Compte: ${data.metadata.paymentAccountId}`, 20, 120);
      }
      doc.text("Statut: En attente de traitement", 20, 130);
    }
  }
};

function addPurchaseDetails(doc: jsPDF, data: ReceiptData, itemType: string) {
  doc.setFontSize(11);
  doc.text(`Type: Achat ${itemType}`, 20, 90);
  
  if (data.entityData) {
    doc.text(`Nom: ${data.entityData.name}`, 30, 100);
    
    if (data.entityData.description) {
      const descriptionLines = doc.splitTextToSize(data.entityData.description, 170);
      doc.text("Description:", 30, 110);
      doc.text(descriptionLines, 30, 120);
    }
    
    if (data.entityData.metadata?.seller) {
      doc.text(`Vendeur: ${data.entityData.metadata.seller}`, 30, 140);
    }
    
    if (data.entityData.metadata?.shop) {
      doc.text(`Boutique: ${data.entityData.metadata.shop}`, 30, 150);
    }
  }
}

export function generateEnhancedReceipt(data: ReceiptData) {
  const doc = new jsPDF();
  
  // En-tête avec logo
  doc.setFillColor(99, 102, 241); // Indigo
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("GAMES TRAFICS", 105, 20, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  
  // Informations de base
  doc.setFontSize(16);
  doc.text("REÇU DE TRANSACTION", 105, 45, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Référence: ${data.reference}`, 20, 60);
  doc.text(`Date: ${data.date.toLocaleString("fr-FR")}`, 20, 67);
  doc.text(`Transaction ID: ${data.transactionId}`, 20, 74);
  
  // Séparateur
  doc.setLineWidth(0.5);
  doc.line(20, 80, 190, 80);
  
  // Détails spécifiques au type
  const template = templates[data.type];
  if (template) {
    template.generate(doc, data);
  }
  
  // Détails financiers
  let yPos = 150;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAILS FINANCIERS", 20, yPos);
  doc.setFont("helvetica", "normal");
  
  yPos += 10;
  doc.text(`Montant: ${data.amount.toFixed(2)} GTC`, 30, yPos);
  
  yPos += 8;
  doc.text(`Frais (${(data.fees / data.amount * 100).toFixed(2)}%): ${data.fees.toFixed(2)} GTC`, 30, yPos);
  
  yPos += 12;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${data.totalAmount.toFixed(2)} GTC`, 30, yPos);
  doc.setFont("helvetica", "normal");
  
  yPos += 12;
  doc.text(`Nouveau solde: ${data.newBalance.toFixed(2)} GTC`, 30, yPos);
  
  // Pied de page
  doc.setLineWidth(0.5);
  doc.line(20, 250, 190, 250);
  
  doc.setFontSize(9);
  doc.text("Merci pour votre confiance !", 105, 260, { align: "center" });
  doc.text("Support: support@gamestrafics.com | Tél: +XXX XX XX XX XX", 105, 265, { align: "center" });
  doc.text("www.gamestrafics.com", 105, 270, { align: "center" });
  
  // QR Code pour vérification
  doc.setFontSize(8);
  doc.text("Scan pour vérifier:", 20, 280);
  // Note: Vous pouvez ajouter un QR code avec une librairie comme 'qrcode'
  
  // Enregistrer le PDF
  doc.save(`receipt-${data.reference}.pdf`);
}

export function getTransactionLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
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