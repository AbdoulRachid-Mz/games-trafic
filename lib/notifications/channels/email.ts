/**
 * Canal Email — Games Trafics
 * Utilise Resend pour l'envoi transactionnel
 */

import { Resend } from "resend";
import type { EmailMessage, SendResult } from "../types";

// ─── Client Resend (lazy) ─────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY est manquant dans les variables d'environnement.");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

// ─── Adresse d'expéditeur par défaut ─────────────────────────────────────────

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "Games Trafics <notifications@games-trafics.com>";
}

// ─── Envoi d'un email ─────────────────────────────────────────────────────────

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY absent — email non envoyé.");
    return { success: false, error: "RESEND_API_KEY manquant" };
  }

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: message.from ?? getFromAddress(),
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      console.error("[Email] Erreur Resend :", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] Exception :", message);
    return { success: false, error: message };
  }
}

// ─── Envoi en masse (avec rate-limiting basique) ─────────────────────────────

export async function sendBulkEmails(
  messages: EmailMessage[],
  options: { delayMs?: number } = {}
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  const delay = options.delayMs ?? 100;

  for (const msg of messages) {
    const result = await sendEmail(msg);
    results.push(result);
    if (delay > 0 && messages.indexOf(msg) < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}
