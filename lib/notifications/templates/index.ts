/**
 * Templates de notifications — Games Trafics
 * Chaque événement produit un message adapté à chaque canal.
 */

import type { NotificationEventType } from "../types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://games-trafic.vercel.app";
const APP_NAME = "Games Trafics";

// ─── Structure d'un template rendu ───────────────────────────────────────────

export interface RenderedTemplate {
  /** Titre court (in-app, push) */
  title: string;
  /** Corps du message texte court (WhatsApp, push) */
  body: string;
  /** HTML complet pour l'email */
  emailHtml: string;
  /** URL de redirection */
  linkUrl?: string;
}

// ─── Données contextuelles par type ──────────────────────────────────────────

export type TemplateData = {
  tournament_registration_confirmed: {
    tournamentName: string;
    editionName: string;
    tournamentId: string;
    editionId: string;
    userName?: string;
  };
  tournament_registration_pending: {
    tournamentName: string;
    editionName: string;
    tournamentId: string;
    editionId: string;
    userName?: string;
  };
  tournament_registration_rejected: {
    tournamentName: string;
    editionName: string;
    reason?: string;
    userName?: string;
  };
  tournament_edition_started: {
    tournamentName: string;
    editionName: string;
    tournamentId: string;
    editionId: string;
    userName?: string;
  };
  tournament_edition_cancelled: {
    tournamentName: string;
    editionName: string;
    userName?: string;
  };
  tournament_match_scheduled: {
    tournamentName: string;
    editionName: string;
    opponentName: string;
    scheduledAt: string;
    tournamentId: string;
    editionId: string;
    userName?: string;
  };
  tournament_match_result: {
    tournamentName: string;
    editionName: string;
    result: "win" | "loss" | "draw";
    score: string;
    tournamentId: string;
    editionId: string;
    userName?: string;
  };
  tournament_bracket_published: {
    tournamentName: string;
    editionName: string;
    tournamentId: string;
    editionId: string;
    userName?: string;
  };
  payment_deposit_confirmed: {
    amount: string;
    currency?: string;
    transactionId?: string;
    userName?: string;
  };
  payment_deposit_pending: {
    amount: string;
    currency?: string;
    userName?: string;
  };
  payment_withdrawal_approved: {
    amount: string;
    currency?: string;
    transactionId?: string;
    userName?: string;
  };
  payment_withdrawal_rejected: {
    amount: string;
    reason?: string;
    userName?: string;
  };
  payment_transfer_received: {
    amount: string;
    senderName: string;
    userName?: string;
  };
  payment_purchase_confirmed: {
    itemName: string;
    amount: string;
    userName?: string;
  };
  wallet_low_balance: {
    balance: string;
    userName?: string;
  };
  account_welcome: {
    userName: string;
  };
  account_verified: {
    userName?: string;
  };
  admin_announcement: {
    title: string;
    message: string;
    linkUrl?: string;
  };
};

// ─── Helpers HTML ─────────────────────────────────────────────────────────────

function wrapEmailHtml(title: string, content: string, linkUrl?: string): string {
  const ctaButton = linkUrl
    ? `<div style="text-align:center;margin:32px 0">
        <a href="${linkUrl}" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">
          Voir maintenant
        </a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;max-width:600px;width:100%">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-0.5px">${APP_NAME}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">La plateforme gaming de référence</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 32px">
          <h2 style="color:#fff;font-size:20px;margin:0 0 16px;font-weight:700">${title}</h2>
          <div style="color:#a1a1aa;font-size:15px;line-height:1.6">
            ${content}
          </div>
          ${ctaButton}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center">
          <p style="color:#52525b;font-size:12px;margin:0">
            © ${new Date().getFullYear()} ${APP_NAME} · <a href="${APP_URL}/settings/notifications" style="color:#f97316">Gérer mes notifications</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Moteur de templates ──────────────────────────────────────────────────────

export function renderTemplate<T extends NotificationEventType>(
  type: T,
  data: T extends keyof TemplateData ? TemplateData[T] : Record<string, unknown>
): RenderedTemplate {
  const d = data as Record<string, unknown>;

  switch (type) {
    // ── Inscriptions tournoi ──────────────────────────────────────────────────
    case "tournament_registration_confirmed": {
      const linkUrl = `${APP_URL}/tournaments/${d.tournamentId}/editions/${d.editionId}`;
      return {
        title: "✅ Inscription confirmée !",
        body: `Ton inscription au tournoi "${d.tournamentName} — ${d.editionName}" est confirmée. Bonne chance !`,
        linkUrl,
        emailHtml: wrapEmailHtml(
          "Inscription confirmée",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Excellente nouvelle ! Ton inscription au tournoi <strong>${d.tournamentName}</strong> — édition <strong>${d.editionName}</strong> est officiellement confirmée.</p>
           <p>Prépare-toi et donne le meilleur de toi-même. 🏆</p>`,
          linkUrl
        ),
      };
    }

    case "tournament_registration_pending": {
      const linkUrl = `${APP_URL}/tournaments/${d.tournamentId}/editions/${d.editionId}`;
      return {
        title: "⏳ Inscription en attente",
        body: `Ta demande d'inscription à "${d.tournamentName} — ${d.editionName}" est en cours de validation.`,
        linkUrl,
        emailHtml: wrapEmailHtml(
          "Inscription en cours de validation",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Ta demande d'inscription au tournoi <strong>${d.tournamentName}</strong> — édition <strong>${d.editionName}</strong> a bien été reçue et est en cours de validation par l'organisateur.</p>
           <p>Tu seras notifié(e) dès qu'une décision sera prise.</p>`,
          linkUrl
        ),
      };
    }

    case "tournament_registration_rejected": {
      return {
        title: "❌ Inscription refusée",
        body: `Ton inscription à "${d.tournamentName} — ${d.editionName}" n'a pas été acceptée.${d.reason ? ` Motif : ${d.reason}` : ""}`,
        emailHtml: wrapEmailHtml(
          "Inscription non acceptée",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Malheureusement, ton inscription au tournoi <strong>${d.tournamentName}</strong> — édition <strong>${d.editionName}</strong> n'a pas été acceptée.</p>
           ${d.reason ? `<p>Motif : <em>${d.reason}</em></p>` : ""}
           <p>D'autres tournois t'attendent sur la plateforme. Ne baisse pas les bras !</p>`,
          `${APP_URL}/tournaments`
        ),
      };
    }

    case "tournament_edition_started": {
      const linkUrl = `${APP_URL}/tournaments/${d.tournamentId}/editions/${d.editionId}`;
      return {
        title: "🏁 Tournoi démarré !",
        body: `L'édition "${d.editionName}" du tournoi "${d.tournamentName}" vient de démarrer. C'est parti !`,
        linkUrl,
        emailHtml: wrapEmailHtml(
          "Le tournoi a démarré !",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>L'édition <strong>${d.editionName}</strong> du tournoi <strong>${d.tournamentName}</strong> est officiellement lancée !</p>
           <p>Consulte ta poule, tes matchs et prépare-toi pour la compétition.</p>`,
          linkUrl
        ),
      };
    }

    case "tournament_edition_cancelled": {
      return {
        title: "🚫 Édition annulée",
        body: `L'édition "${d.editionName}" du tournoi "${d.tournamentName}" a été annulée.`,
        emailHtml: wrapEmailHtml(
          "Édition annulée",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Nous te informons que l'édition <strong>${d.editionName}</strong> du tournoi <strong>${d.tournamentName}</strong> a malheureusement été annulée.</p>
           <p>Si tu as effectué un paiement, un remboursement sera traité dans les plus brefs délais.</p>`,
          `${APP_URL}/tournaments`
        ),
      };
    }

    case "tournament_match_scheduled": {
      const linkUrl = `${APP_URL}/tournaments/${d.tournamentId}/editions/${d.editionId}`;
      return {
        title: "📅 Match programmé",
        body: `Ton prochain match contre ${d.opponentName} est prévu le ${d.scheduledAt}.`,
        linkUrl,
        emailHtml: wrapEmailHtml(
          "Match programmé",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Un match vient d'être programmé dans le cadre de <strong>${d.tournamentName} — ${d.editionName}</strong>.</p>
           <p><strong>Adversaire :</strong> ${d.opponentName}<br>
              <strong>Date :</strong> ${d.scheduledAt}</p>
           <p>Prépare-toi et donne le meilleur de toi-même ! 💪</p>`,
          linkUrl
        ),
      };
    }

    case "tournament_match_result": {
      const resultLabels = { win: "🏆 Victoire !", loss: "😔 Défaite", draw: "🤝 Match nul" };
      const label = resultLabels[d.result as "win" | "loss" | "draw"] ?? "Résultat";
      const linkUrl = `${APP_URL}/tournaments/${d.tournamentId}/editions/${d.editionId}`;
      return {
        title: label,
        body: `Résultat de ton match : ${label} (${d.score}) dans "${d.tournamentName} — ${d.editionName}".`,
        linkUrl,
        emailHtml: wrapEmailHtml(
          `Résultat de ton match : ${label}`,
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Le résultat de ton match vient d'être publié dans <strong>${d.tournamentName} — ${d.editionName}</strong>.</p>
           <p style="font-size:28px;text-align:center;margin:24px 0"><strong>${label}</strong></p>
           <p style="text-align:center;color:#f97316;font-size:20px"><strong>Score : ${d.score}</strong></p>`,
          linkUrl
        ),
      };
    }

    case "tournament_bracket_published": {
      const linkUrl = `${APP_URL}/tournaments/${d.tournamentId}/editions/${d.editionId}?tab=tree`;
      return {
        title: "🌲 Tableau de playoffs publié",
        body: `Le tableau des playoffs pour "${d.tournamentName} — ${d.editionName}" est disponible !`,
        linkUrl,
        emailHtml: wrapEmailHtml(
          "Tableau des playoffs disponible",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Le tableau des playoffs de <strong>${d.tournamentName} — ${d.editionName}</strong> vient d'être publié.</p>
           <p>Découvre ton chemin vers la victoire !</p>`,
          linkUrl
        ),
      };
    }

    // ── Finance ───────────────────────────────────────────────────────────────
    case "payment_deposit_confirmed": {
      return {
        title: "💰 Dépôt confirmé",
        body: `Ton dépôt de ${d.amount} ${d.currency ?? "FCFA"} a été confirmé.`,
        linkUrl: `${APP_URL}/wallet`,
        emailHtml: wrapEmailHtml(
          "Dépôt confirmé",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Ton dépôt de <strong>${d.amount} ${d.currency ?? "FCFA"}</strong> a été confirmé et crédité sur ton compte.${d.transactionId ? `<br>Référence : <code>${d.transactionId}</code>` : ""}</p>`,
          `${APP_URL}/wallet`
        ),
      };
    }

    case "payment_deposit_pending": {
      return {
        title: "⏳ Dépôt en cours de validation",
        body: `Ton dépôt de ${d.amount} ${d.currency ?? "FCFA"} est en cours de validation.`,
        linkUrl: `${APP_URL}/wallet`,
        emailHtml: wrapEmailHtml(
          "Dépôt en cours de validation",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Ton dépôt de <strong>${d.amount} ${d.currency ?? "FCFA"}</strong> est en cours de traitement. Tu seras notifié(e) dès sa validation.</p>`,
          `${APP_URL}/wallet`
        ),
      };
    }

    case "payment_withdrawal_approved": {
      return {
        title: "✅ Retrait approuvé",
        body: `Ton retrait de ${d.amount} ${d.currency ?? "FCFA"} a été approuvé.`,
        linkUrl: `${APP_URL}/wallet`,
        emailHtml: wrapEmailHtml(
          "Retrait approuvé",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Ton retrait de <strong>${d.amount} ${d.currency ?? "FCFA"}</strong> a été approuvé.${d.transactionId ? `<br>Référence : <code>${d.transactionId}</code>` : ""}</p>
           <p>Le virement sera effectué sous 24–72h selon ton opérateur.</p>`,
          `${APP_URL}/wallet`
        ),
      };
    }

    case "payment_withdrawal_rejected": {
      return {
        title: "❌ Retrait refusé",
        body: `Ton retrait de ${d.amount} ${d.currency ?? "FCFA"} a été refusé.${d.reason ? ` Motif : ${d.reason}` : ""}`,
        linkUrl: `${APP_URL}/wallet`,
        emailHtml: wrapEmailHtml(
          "Retrait refusé",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Ton retrait de <strong>${d.amount} ${d.currency ?? "FCFA"}</strong> n'a pas pu être traité.</p>
           ${d.reason ? `<p>Motif : <em>${d.reason}</em></p>` : ""}
           <p>Contacte le support si tu as des questions.</p>`,
          `${APP_URL}/support`
        ),
      };
    }

    case "payment_transfer_received": {
      return {
        title: "💸 Transfert reçu",
        body: `Tu as reçu ${d.amount} FCFA de ${d.senderName}.`,
        linkUrl: `${APP_URL}/wallet`,
        emailHtml: wrapEmailHtml(
          "Transfert reçu",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p><strong>${d.senderName}</strong> vient de t'envoyer <strong>${d.amount} FCFA</strong>.</p>`,
          `${APP_URL}/wallet`
        ),
      };
    }

    case "payment_purchase_confirmed": {
      return {
        title: "🛍️ Achat confirmé",
        body: `Ton achat de "${d.itemName}" (${d.amount} FCFA) est confirmé.`,
        emailHtml: wrapEmailHtml(
          "Achat confirmé",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Ton achat de <strong>${d.itemName}</strong> pour <strong>${d.amount} FCFA</strong> est bien confirmé. Profite-en ! 🎮</p>`,
          `${APP_URL}/shop`
        ),
      };
    }

    case "wallet_low_balance": {
      return {
        title: "⚠️ Solde faible",
        body: `Ton solde est de ${d.balance} FCFA. Pense à recharger ton compte.`,
        linkUrl: `${APP_URL}/wallet/deposit`,
        emailHtml: wrapEmailHtml(
          "Solde de compte faible",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Ton solde actuel est de <strong>${d.balance} FCFA</strong>. Pour continuer à profiter de tous les tournois et services, pense à recharger ton compte.</p>`,
          `${APP_URL}/wallet/deposit`
        ),
      };
    }

    // ── Compte ────────────────────────────────────────────────────────────────
    case "account_welcome": {
      return {
        title: `🎮 Bienvenue, ${d.userName} !`,
        body: `Bienvenue sur ${APP_NAME} ! Ton compte est prêt. Place aux tournois !`,
        linkUrl: `${APP_URL}/tournaments`,
        emailHtml: wrapEmailHtml(
          `Bienvenue sur ${APP_NAME}, ${d.userName} !`,
          `<p>Salut <strong>${d.userName}</strong> 👋</p>
           <p>Bienvenue sur <strong>${APP_NAME}</strong>, la plateforme gaming de référence pour organiser et rejoindre des tournois de haut niveau.</p>
           <p>Commence dès maintenant à explorer les tournois disponibles et constitue ton équipe !</p>`,
          `${APP_URL}/tournaments`
        ),
      };
    }

    case "account_verified": {
      return {
        title: "✅ Compte vérifié",
        body: `Ton compte ${APP_NAME} est maintenant vérifié. Tu as accès à toutes les fonctionnalités !`,
        linkUrl: `${APP_URL}/dashboard`,
        emailHtml: wrapEmailHtml(
          "Compte vérifié avec succès",
          `<p>Bonjour${d.userName ? ` <strong>${d.userName}</strong>` : ""} 👋</p>
           <p>Ton identité a été vérifiée avec succès. Tu as désormais accès à toutes les fonctionnalités de ${APP_NAME}.</p>`,
          `${APP_URL}/dashboard`
        ),
      };
    }

    // ── Annonce admin ─────────────────────────────────────────────────────────
    case "admin_announcement": {
      return {
        title: d.title as string,
        body: d.message as string,
        linkUrl: (d.linkUrl as string) ?? `${APP_URL}`,
        emailHtml: wrapEmailHtml(
          d.title as string,
          `<p>${(d.message as string).replace(/\n/g, "<br>")}</p>`,
          d.linkUrl as string | undefined
        ),
      };
    }

    default:
      return {
        title: "Notification",
        body: "Vous avez une nouvelle notification.",
        emailHtml: wrapEmailHtml("Notification", "<p>Vous avez une nouvelle notification.</p>"),
      };
  }
}
