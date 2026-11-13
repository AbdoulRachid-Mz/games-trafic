import { formatAmount, formatColumnValue, formatDateTime, isBlank, toPdfSafeText } from "../format";
import type {
  BadgeTone,
  DocumentBadge,
  DocumentField,
  DocumentModel,
  DocumentTable,
} from "../types";
import { chunk } from "./shared";

export interface PdfRenderOptions {
  /** Logo déjà encodé en data URL (chargement effectué par l'appelant). */
  logoDataUrl?: string;
}

const COLORS = {
  primary: [79, 70, 229] as [number, number, number],
  dark: [17, 24, 39] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  soft: [249, 250, 251] as [number, number, number],
};

const BADGE_TONES: Record<
  BadgeTone,
  { fill: [number, number, number]; text: [number, number, number] }
> = {
  neutral: { fill: [243, 244, 246], text: [55, 65, 81] },
  success: { fill: [220, 252, 231], text: [22, 101, 52] },
  warning: { fill: [254, 249, 195], text: [133, 77, 14] },
  danger: { fill: [254, 226, 226], text: [153, 27, 27] },
  info: { fill: [224, 231, 255], text: [55, 48, 163] },
};

function visibleFields(fields: DocumentField[]): DocumentField[] {
  return fields.filter((entry) => {
    if (entry.hideWhenEmpty === false) return true;
    return !isBlank(entry.value);
  });
}

function fieldText(entry: DocumentField): string {
  return formatColumnValue(entry.value, {
    type: entry.type,
    currency: entry.currency,
  });
}

export async function renderPdf(
  model: DocumentModel,
  options: PdfRenderOptions = {},
): Promise<Blob> {
  const jspdfModule: any = await import("jspdf");
  const JsPDF = jspdfModule.jsPDF ?? jspdfModule.default;
  const autoTableModule: any = await import("jspdf-autotable");
  const autoTable = autoTableModule.default ?? autoTableModule;

  const doc = new JsPDF({
    orientation: model.meta.orientation ?? "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const footerTop = pageHeight - 16;

  let y = margin;

  doc.setProperties({
    title: model.meta.title,
    subject: model.meta.subject ?? model.meta.reference ?? model.meta.title,
    author: model.brand.name,
    creator: model.brand.name,
  });

  const ensureSpace = (height: number) => {
    if (y + height > footerTop) {
      doc.addPage();
      y = margin;
    }
  };

  // ── En-tête ────────────────────────────────────────────────────────────────
  const logoSize = 12;
  if (options.logoDataUrl) {
    try {
      doc.addImage(options.logoDataUrl, "PNG", margin, y, logoSize, logoSize);
    } catch {
      // Un logo illisible ne doit jamais empêcher la génération du document.
    }
  }

  const headerX = options.logoDataUrl ? margin + logoSize + 4 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text(toPdfSafeText(model.brand.name).toUpperCase(), headerX, y + 4);

  if (model.brand.tagline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(toPdfSafeText(model.brand.tagline), headerX, y + 8);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    `Généré le ${toPdfSafeText(formatDateTime(model.meta.generatedAt))}`,
    pageWidth - margin,
    y + 4,
    { align: "right" },
  );
  if (model.meta.generatedBy) {
    doc.text(
      `Par ${toPdfSafeText(model.meta.generatedBy)}`,
      pageWidth - margin,
      y + 8,
      { align: "right" },
    );
  }

  y += logoSize + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.dark);
  doc.text(toPdfSafeText(model.meta.title), margin, y + 4);
  y += 9;

  if (model.meta.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(toPdfSafeText(model.meta.subtitle), margin, y + 3);
    y += 6;
  }

  if (model.meta.reference) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text(
      `Référence : ${toPdfSafeText(model.meta.reference)}`,
      margin,
      y + 3,
    );
    y += 6;
  }

  if (model.meta.totalRecords !== undefined) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `${model.meta.totalRecords} enregistrement${model.meta.totalRecords > 1 ? "s" : ""}`,
      margin,
      y + 3,
    );
    y += 6;
  }

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ── Sections ───────────────────────────────────────────────────────────────
  const drawFieldsGrid = (
    title: string | undefined,
    fields: DocumentField[],
    columns: 1 | 2 | 3 = 2,
  ) => {
    const visible = visibleFields(fields);
    if (visible.length === 0) return;

    if (title) {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.dark);
      doc.text(toPdfSafeText(title), margin, y + 4);
      y += 7;
    }

    const columnWidth = contentWidth / columns;
    for (const row of chunk(visible, columns)) {
      const prepared = row.map((entry) => {
        const value = fieldText(entry) || "—";
        const lines = doc.splitTextToSize(
          toPdfSafeText(value),
          columnWidth - 4,
        ) as string[];
        return { entry, shown: lines.slice(0, 3) };
      });
      const rowHeight = prepared.reduce(
        (height, item) => Math.max(height, 8 + item.shown.length * 3.8),
        0,
      );
      ensureSpace(rowHeight + 2);

      prepared.forEach(({ entry, shown }, index) => {
        const x = margin + index * columnWidth;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.muted);
        doc.text(toPdfSafeText(entry.label), x, y + 3, {
          maxWidth: columnWidth - 3,
        });
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        doc.text(shown, x, y + 7.5);
      });
      y += rowHeight;
    }
    y += 2;
  };

  const drawTextSection = (title: string | undefined, text: string) => {
    if (isBlank(text)) return;
    if (title) {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.dark);
      doc.text(toPdfSafeText(title), margin, y + 4);
      y += 7;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    const lines = doc.splitTextToSize(
      toPdfSafeText(text),
      contentWidth,
    ) as string[];
    const lineHeight = 4.4;
    let index = 0;
    while (index < lines.length) {
      const available = Math.max(
        1,
        Math.floor((footerTop - y - 4) / lineHeight),
      );
      const slice = lines.slice(index, index + available);
      doc.text(slice, margin, y + 4);
      y += slice.length * lineHeight + 2;
      index += slice.length;
      if (index < lines.length) {
        doc.addPage();
        y = margin;
      }
    }
    y += 2;
  };

  const drawBadges = (badges: DocumentBadge[]) => {
    if (badges.length === 0) return;
    ensureSpace(10);
    let x = margin;
    const height = 6;
    for (const badge of badges) {
      const tone = BADGE_TONES[badge.tone ?? "neutral"] ?? BADGE_TONES.neutral;
      const label = toPdfSafeText(badge.label);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const width = doc.getTextWidth(label) + 7;
      if (x + width > pageWidth - margin) {
        x = margin;
        y += height + 2;
        ensureSpace(height + 2);
      }
      doc.setFillColor(...tone.fill);
      doc.setDrawColor(...tone.fill);
      doc.roundedRect(x, y, width, height, 1.6, 1.6, "F");
      doc.setTextColor(...tone.text);
      doc.text(label, x + 3.5, y + 4.1);
      x += width + 3;
    }
    y += height + 6;
  };

  const drawTable = (title: string | undefined, table: DocumentTable) => {
    if (title) {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.dark);
      doc.text(toPdfSafeText(title), margin, y + 4);
      y += 7;
    }

    if (table.rows.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text("Aucune donnée disponible.", margin, y + 4);
      y += 10;
      return;
    }

    const head = [table.columns.map((column) => toPdfSafeText(column.label))];
    const body = table.rows.map((row) =>
      table.columns.map((column) =>
        toPdfSafeText(formatColumnValue(row[column.key], column)),
      ),
    );

    const columnStyles: Record<number, any> = {};
    table.columns.forEach((column, index) => {
      const align =
        column.align ??
        (column.type === "number" || column.type === "currency"
          ? "right"
          : "left");
      columnStyles[index] = {
        halign: align,
        cellWidth: column.width ? `${column.width}*` : "auto",
      };
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: "grid",
      margin: { left: margin, right: margin, top: margin, bottom: 22 },
      styles: {
        font: "helvetica",
        fontSize: 7.6,
        cellPadding: 2.2,
        textColor: COLORS.dark,
        lineColor: COLORS.border,
        lineWidth: 0.15,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.6,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
    });

    y = ((doc as any).lastAutoTable?.finalY ?? y) + 5;

    if (table.totals && table.totals.length > 0) {
      ensureSpace(6 * table.totals.length + 3);
      for (const total of table.totals) {
        const value =
          total.type === "currency"
            ? formatAmount(total.value, total.currency)
            : total.type === "percentage"
              ? `${total.value} %`
              : String(total.value);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.dark);
        doc.text(
          `${toPdfSafeText(total.label)} : ${toPdfSafeText(value)}`,
          pageWidth - margin,
          y + 3,
          { align: "right" },
        );
        y += 5;
      }
      y += 2;
    }
    y += 3;
  };

  const drawSummary = (title: string | undefined, fields: DocumentField[]) => {
    const visible = visibleFields(fields);
    if (visible.length === 0) return;
    const boxHeight = 8 + visible.length * 6;
    ensureSpace(boxHeight + 4);
    doc.setFillColor(...COLORS.soft);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

    if (title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.dark);
      doc.text(toPdfSafeText(title), margin + 4, y + 6);
    }

    visible.forEach((entry, index) => {
      const lineY = y + (title ? 12 : 7) + index * 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(toPdfSafeText(entry.label), margin + 4, lineY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.dark);
      doc.text(toPdfSafeText(fieldText(entry) || "—"), pageWidth - margin - 4, lineY, {
        align: "right",
      });
    });

    y += boxHeight + 6;
  };

  for (const section of model.sections) {
    switch (section.kind) {
      case "badges":
        drawBadges(section.badges);
        break;
      case "text":
        drawTextSection(section.title, section.text);
        break;
      case "fields":
        drawFieldsGrid(section.title, section.fields, section.columns ?? 2);
        break;
      case "table":
        drawTable(section.title, section.table);
        break;
      case "summary":
        drawSummary(section.title, section.fields);
        break;
    }
  }

  // ── Pied de page (toutes les pages) ────────────────────────────────────────
  const contact = [model.brand.email, model.brand.address]
    .filter(Boolean)
    .join(" · ");
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, footerTop + 2, pageWidth - margin, footerTop + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      toPdfSafeText(
        `${model.brand.name}${contact ? ` · ${contact}` : ""}`,
      ),
      margin,
      footerTop + 7,
    );
    doc.text(`Page ${page} sur ${pageCount}`, pageWidth - margin, footerTop + 7, {
      align: "right",
    });
  }

  return doc.output("blob");
}
