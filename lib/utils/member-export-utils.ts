import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Utility to export member data in various formats.
 */

interface ExportData {
  appName: string;
  appContact: string;
  editionName: string;
  members: any[];
}

export function exportToCSV(data: ExportData) {
  const headers = ["Nom Affiché", "Email", "Téléphone", "Équipe", "Date d'inscription", "Statut"];
  const rows = data.members.map(m => [
    m.displayName || m.user?.username || "N/A",
    m.contactEmail || m.user?.email || "N/A",
    m.contactPhone || m.user?.phoneNumber || "N/A",
    m.team?.name || "Solo",
    m.joinedAt ? format(new Date(m.joinedAt), "PP", { locale: fr }) : "N/A",
    m.isBanned ? "Banni" : m.isActive ? "Actif" : "Inactif"
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `membres-${data.editionName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), "yyyy-MM-dd")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data: ExportData) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `membres-${data.editionName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), "yyyy-MM-dd")}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Simple PDF export using window.print() or jspdf if available.
 * Here we generate a printable HTML table.
 */
export function exportToPDF(data: ExportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Liste des membres - ${data.editionName}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #eee; margin-bottom: 30px; padding-bottom: 20px; }
          .app-info { font-size: 12px; color: #666; margin-top: 5px; }
          h1 { margin: 0; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #eee; padding: 12px; text-align: left; font-size: 13px; }
          th { background-color: #f9f9f9; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.appName}</h1>
          <div class="app-info">${data.appContact}</div>
          <p><strong>Édition :</strong> ${data.editionName}</p>
          <p><strong>Date du rapport :</strong> ${format(new Date(), "PPP", { locale: fr })}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Équipe</th>
              <th>Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            ${data.members.map(m => `
              <tr>
                <td>${m.displayName || m.user?.username || "N/A"}</td>
                <td>${m.contactEmail || m.user?.email || "N/A"}</td>
                <td>${m.contactPhone || m.user?.phoneNumber || "N/A"}</td>
                <td>${m.team?.name || "Solo"}</td>
                <td>${m.joinedAt ? format(new Date(m.joinedAt), "PP", { locale: fr }) : "N/A"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Généré par ${data.appName} - ${new Date().getFullYear()}
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
