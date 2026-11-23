/**
 * Webhook WhatsApp Cloud API — Games Trafics
 * GET  : vérification du webhook par Meta
 * POST : réception des messages entrants et status updates
 */

import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/notifications/channels/whatsapp";

// ─── Types de payload WhatsApp ────────────────────────────────────────────────

interface WhatsAppWebhookPayload {
  object: string;
  entry?: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: { profile: { name: string }; wa_id: string }[];
        messages?: {
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
        }[];
        statuses?: {
          id: string;
          status: "sent" | "delivered" | "read" | "failed";
          timestamp: string;
          recipient_id: string;
          errors?: { code: number; title: string }[];
        }[];
      };
      field: string;
    }[];
  }[];
}

// ─── GET — Vérification du webhook ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const mode = searchParams.get("hub.mode") ?? "";
  const token = searchParams.get("hub.verify_token") ?? "";
  const challenge = searchParams.get("hub.challenge") ?? "";

  const result = verifyWebhook({ mode, token, challenge });

  if (result !== null) {
    return new NextResponse(result, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Vérification échouée — token invalide.");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST — Réception des messages ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WhatsAppWebhookPayload;

    // Vérifier que c'est bien un payload WhatsApp
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const changes = body.entry?.flatMap((e) => e.changes) ?? [];

    for (const change of changes) {
      const value = change.value;

      // ── Messages entrants ────────────────────────────────────────────────
      if (value.messages?.length) {
        for (const msg of value.messages) {
          const from = msg.from;
          const text = msg.text?.body ?? "";
          const contact = value.contacts?.find((c) => c.wa_id === from);
          const name = contact?.profile?.name ?? "Inconnu";

          console.info(`[WhatsApp] Message de ${name} (${from}) : "${text}"`);

          // Ici on pourrait implémenter une logique de réponse automatique
          // Par exemple : répondre à des commandes comme "SOLDE", "AIDE", etc.
          // Pour l'instant on log uniquement
        }
      }

      // ── Status updates ───────────────────────────────────────────────────
      if (value.statuses?.length) {
        for (const status of value.statuses) {
          if (status.status === "failed" && status.errors?.length) {
            console.error(
              `[WhatsApp] Échec d'envoi pour ${status.recipient_id} :`,
              status.errors
            );
          } else {
            console.debug(
              `[WhatsApp] Status "${status.status}" pour message ${status.id}`
            );
          }
        }
      }
    }

    // Meta requiert une réponse 200 pour confirmer la réception
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[WhatsApp Webhook] Erreur :", err);
    // Toujours renvoyer 200 pour éviter les relivraisons Meta
    return NextResponse.json({ status: "error_logged" }, { status: 200 });
  }
}
