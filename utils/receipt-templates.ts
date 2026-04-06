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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Couleurs de l'app
  const primaryColor = [99, 102, 241]; // Indigo
  const secondaryColor = [139, 92, 246]; // Purple
  
  // Header avec dégradé
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 45, 'F');
  
  // Logo placeholder (à remplacer par votre vrai logo)
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 10, 25, 25, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(16);
  doc.text("GT", 27.5, 28, { align: "center" });
  
  // Titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("GAMES TRAFICS", 105, 22, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Plateforme de Gaming & E-commerce", 105, 32, { align: "center" });
  
  // Type de document
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 45, 210, 15, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("REÇU DE TRANSACTION", 105, 55, { align: "center" });
  
  // Informations de base
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Référence: ${data.reference}`, 20, 75);
  doc.text(`Date: ${data.date.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}`, 20, 82);
  doc.text(`Transaction ID: ${data.transactionId.slice(0, 8)}...${data.transactionId.slice(-8)}`, 20, 89);
  
  // Séparateur
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 95, 190, 95);
  
  // Détails spécifiques
  const template = templates[data.type];
  if (template) {
    template.generate(doc, data);
  }
  
  let yPos = 150;
  
  // Section financière avec design amélioré
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(20, yPos - 5, 170, 50, 5, 5, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DÉTAILS FINANCIERS", 20, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  yPos += 10;
  doc.text("Montant brut:", 30, yPos);
  doc.text(`${data.amount.toFixed(2)} GTC`, 170, yPos, { align: "right" });
  
  yPos += 8;
  doc.text("Frais de transaction:", 30, yPos);
  const feePercent = data.amount > 0 ? (data.fees / data.amount * 100).toFixed(2) : "0";
  doc.text(`${data.fees.toFixed(2)} GTC (${feePercent}%)`, 170, yPos, { align: "right" });
  
  yPos += 12;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Total débité:", 30, yPos);
  doc.text(`${data.totalAmount.toFixed(2)} GTC`, 170, yPos, { align: "right" });
  
  yPos += 8;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text("Montant reçu:", 30, yPos);
  const receivedAmount = Math.max(0, data.totalAmount - data.fees);
  doc.text(`${receivedAmount.toFixed(2)} GTC`, 170, yPos, { align: "right" });
  
  yPos += 12;
  doc.text("Nouveau solde:", 30, yPos);
  doc.text(`${data.newBalance.toFixed(2)} GTC`, 170, yPos, { align: "right" });
  
  // Footer
  const footerY = 265;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY, 190, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Games Trafics - Plateforme de Gaming sécurisée", 105, footerY + 8, { align: "center" });
  doc.text("Tahoua, Niger | support@gamestrafics.com | +227 XX XX XX XX", 105, footerY + 14, { align: "center" });
  doc.text("© Games Trafics - Tous droits réservés", 105, footerY + 20, { align: "center" });
  
  // Sauvegarde
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
