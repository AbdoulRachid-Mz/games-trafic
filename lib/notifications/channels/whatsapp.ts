/**
 * Canal WhatsApp Cloud API — Games Trafics
 * Documentation : https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import type { WhatsAppMessage, WhatsAppTemplateMessage, SendResult } from "../types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ─── Client WhatsApp ──────────────────────────────────────────────────────────

function getConfig(): { phoneNumberId: string; accessToken: string } {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      "Variables d'environnement WhatsApp manquantes : WHATSAPP_PHONE_NUMBER_ID et/ou WHATSAPP_ACCESS_TOKEN"
    );
  }

  return { phoneNumberId, accessToken };
}

// ─── Normaliser le numéro de téléphone ───────────────────────────────────────

export function normalizePhone(phone: string): string {
  // Supprimer tous les caractères non numériques sauf le +
  const cleaned = phone.replace(/[^\d+]/g, "");
  // Retirer le + de début si présent (l'API Meta attend juste les chiffres)
  return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
}

// ─── Envoi d'un message texte ─────────────────────────────────────────────────

export async function sendWhatsAppText(to: string, text: string): Promise<SendResult> {
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.warn("[WhatsApp] Variables d'env absentes — message non envoyé.");
    return { success: false, error: "Configuration WhatsApp manquante" };
  }

  try {
    const { phoneNumberId, accessToken } = getConfig();
    const normalizedTo = normalizePhone(to);

    const response = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedTo,
        type: "text",
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = (await response.json()) as {
      messages?: { id: string }[];
      error?: { message: string; code: number };
    };

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message ?? `HTTP ${response.status}`;
      console.error("[WhatsApp] Erreur API :", errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true, id: data.messages?.[0]?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp] Exception :", msg);
    return { success: false, error: msg };
  }
}

// ─── Envoi d'un message template ─────────────────────────────────────────────

export async function sendWhatsAppTemplate(
  options: Omit<WhatsAppTemplateMessage, "type">
): Promise<SendResult> {
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.warn("[WhatsApp] Variables d'env absentes — template non envoyé.");
    return { success: false, error: "Configuration WhatsApp manquante" };
  }

  try {
    const { phoneNumberId, accessToken } = getConfig();
    const normalizedTo = normalizePhone(options.to);

    const response = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "template",
        template: {
          name: options.templateName,
          language: { code: options.languageCode },
          components: options.components ?? [],
        },
      }),
    });

    const data = (await response.json()) as {
      messages?: { id: string }[];
      error?: { message: string; code: number };
    };

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message ?? `HTTP ${response.status}`;
      console.error("[WhatsApp] Erreur template :", errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true, id: data.messages?.[0]?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp] Exception template :", msg);
    return { success: false, error: msg };
  }
}

// ─── Vérification du webhook (GET) ───────────────────────────────────────────

export function verifyWebhook(params: {
  mode: string;
  token: string;
  challenge: string;
}): string | null {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (params.mode === "subscribe" && params.token === verifyToken) {
    return params.challenge;
  }
  return null;
}
