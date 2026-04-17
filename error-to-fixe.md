🚨 Diagnostic rapide (le vrai problème)

Le HTML que tu montres contient :

NEXT_HTTP_ERROR_FALLBACK;404
Édition Inconnue
page Next.js complète

👉 Donc ton export est probablement appelé via :

une URL incorrecte (fetch("/api/export...") faux ou route inexistante)
ou une Server Action utilisée comme API sans POST
ou un return doc.output("datauristring") mal interprété côté client
ou un res.json() jamais atteint (car erreur avant)
💥 Problèmes dans TON code

Je vois 3 erreurs critiques :

❌ 1. Tu ne sécurises pas la sortie PDF / Excel correctement

Tu fais :

data = doc.output("datauristring");

⚠️ Problème :

ce format n’est PAS adapté à un téléchargement direct
côté Next.js, ça peut être transformé en page HTML si mal consommé
❌ 2. Tu mélanges “server action” et “download client”

Ton function retourne :

return { success: true, data, filename }

👉 MAIS rien ne force un vrai téléchargement.

Donc côté frontend tu fais sûrement un truc du genre :

window.open(data)

👉 et si data est invalide → Next renvoie une page HTML 404

❌ 3. Excel = Blob URL côté serveur ❌

Tu fais :

data = URL.createObjectURL(blob);

🚨 GROS BUG :
URL.createObjectURL() fonctionne UNIQUEMENT dans le navigateur, PAS dans Node.js / Server Actions

✅ SOLUTION PROPRE (ARCHITECTURE CORRECTE)

Tu dois choisir UNE approche :

✅ OPTION 1 (RECOMMANDÉE) : API Route Next.js (propre export)

Crée une route :

/app/api/export/matches/route.ts
Exemple FIX complet :
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Parser } from "json2csv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const format = searchParams.get("format");
  const editionId = searchParams.get("editionId");

  if (!editionId) {
    return NextResponse.json({ error: "Missing editionId" }, { status: 400 });
  }

  // TODO: fetch data ici
  const data = [
    { name: "test", email: "test@mail.com" }
  ];

  if (format === "csv") {
    const parser = new Parser();
    const csv = parser.parse(data);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=export.csv`,
      },
    });
  }

  if (format === "json") {
    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename=export.json`,
      },
    });
  }

  if (format === "pdf") {
    const doc = new jsPDF();
    doc.text("Export PDF", 10, 10);

    const pdf = doc.output("arraybuffer");

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=export.pdf`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}
✅ FRONTEND (IMPORTANT)

Tu dois télécharger comme ça :

const res = await fetch(`/api/export/matches?editionId=${id}&format=csv`);
const blob = await res.blob();

const url = window.URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "export.csv";
a.click();
⚠️ ERREUR PRINCIPALE DANS TON CODE ACTUEL
Tu fais un export comme si c’était :

👉 une fonction directe

mais tu l’utilises comme :
👉 une API HTTP

🔥 BONUS : correction Excel (très important)

Tu dois déplacer ça côté client OU API node-safe :

const XLSX = await import("xlsx");

ET retourner un buffer :

const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

PAS createObjectURL.