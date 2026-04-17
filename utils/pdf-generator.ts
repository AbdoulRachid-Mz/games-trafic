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
  
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("GAMES TRAFICS", 105, 18, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text("REÇU DE TRANSACTION", 105, 38, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);
  
  doc.setFontSize(10);
  let yPos = 50;
  
  doc.text(`Référence: ${data.reference}`, 20, yPos);
  yPos += 8;
  doc.text(`Date: ${data.date.toLocaleString("fr-FR")}`, 20, yPos);
  yPos += 8;
  doc.text(`Type: ${getTransactionLabel(data.type)}`, 20, yPos);
  yPos += 8;
  doc.text("Adresse: Tahoua, Niger", 20, yPos);
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
  
  doc.text("", 20, yPos);
  
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
  
  yPos += 7;
  doc.text(`Net: ${(data.totalAmount - data.fees).toFixed(2)} GTC`, 30, yPos);
  
  yPos += 12;
  doc.text(`Nouveau solde: ${data.newBalance.toFixed(2)} GTC`, 30, yPos);
  
  doc.setLineWidth(0.5);
  doc.line(20, 250, 190, 250);
  
  doc.setFontSize(9);
  doc.text("Support: support@gamestrafics.com | Tél: +227 00 00 00 00", 105, 258, { align: "center" });
  doc.text("Tahoua - Niger", 105, 263, { align: "center" });
  doc.text("© Games Trafics", 105, 268, { align: "center" });
  
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

/**
 * Générateur PDF générique pour l'application
 */
export async function generatePDFReport(
  title: string,
  headers: string[],
  body: string[][],
  config: {
    filename?: string;
    subtitle?: string;
    orientation?: 'p' | 'l';
    unit?: 'mm' | 'pt' | 'px';
    format?: string;
  } = {}
) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: config.orientation || 'p',
    unit: config.unit || 'mm',
    format: config.format || 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header Background
  doc.setFillColor(99, 102, 241); // Indigo-500
  doc.rect(0, 0, pageWidth, 25, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 16);

  // Subtitle
  if (config.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(config.subtitle, margin, 21);
  }

  // Application Info
  doc.setFontSize(8);
  doc.text("GAMES TRAFICS", pageWidth - margin, 16, { align: "right" });
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, 21, { align: "right" });

  // Table
  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo-600
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Gray-50
    },
    margin: { left: margin, right: margin, bottom: 20 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setTextColor(156, 163, 175); // Gray-400
      doc.setFontSize(7);
      doc.text(
        `Page ${currentPage} sur ${pageCount} - Document généré par Games Trafics`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }
  });

  const finalFilename = config.filename || `report-${Date.now()}.pdf`;
  doc.save(finalFilename);
}
