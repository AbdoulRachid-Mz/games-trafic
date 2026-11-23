/**
 * Types centraux du système de notifications Games Trafics
 */

// ─── Canaux disponibles ───────────────────────────────────────────────────────

export type NotificationChannel = "in_app" | "email" | "whatsapp" | "push";

// ─── Types d'événements ───────────────────────────────────────────────────────

export type NotificationEventType =
  | "tournament_registration_confirmed"
  | "tournament_registration_pending"
  | "tournament_registration_rejected"
  | "tournament_edition_started"
  | "tournament_edition_cancelled"
  | "tournament_match_scheduled"
  | "tournament_match_result"
  | "tournament_bracket_published"
  | "payment_deposit_confirmed"
  | "payment_deposit_pending"
  | "payment_withdrawal_approved"
  | "payment_withdrawal_rejected"
  | "payment_transfer_received"
  | "payment_purchase_confirmed"
  | "wallet_low_balance"
  | "account_welcome"
  | "account_verified"
  | "admin_announcement";

// ─── Payload générique d'un événement ────────────────────────────────────────

export interface NotificationEvent<T extends Record<string, unknown> = Record<string, unknown>> {
  type: NotificationEventType;
  userId: string;
  /** Données contextuelles de l'événement */
  data: T;
  /** Canaux à utiliser — si absent, déterminé par les préférences utilisateur */
  channels?: NotificationChannel[];
}

// ─── Résultat d'envoi par canal ───────────────────────────────────────────────

export interface ChannelResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
}

export interface DispatchResult {
  success: boolean;
  results: ChannelResult[];
  notificationId?: string;
}

// ─── Préférences utilisateur ──────────────────────────────────────────────────

export interface UserNotificationPreferences {
  in_app: boolean;
  email: boolean;
  whatsapp: boolean;
  push: boolean;
  /** Numéro WhatsApp au format international, ex: +22890123456 */
  whatsappPhone?: string;
  emailOverride?: string;
}

// ─── Message WhatsApp ─────────────────────────────────────────────────────────

export interface WhatsAppTextMessage {
  type: "text";
  to: string;
  text: string;
}

export interface WhatsAppTemplateMessage {
  type: "template";
  to: string;
  templateName: string;
  languageCode: string;
  components?: WhatsAppTemplateComponent[];
}

export type WhatsAppTemplateComponent =
  | { type: "header"; parameters: WhatsAppParameter[] }
  | { type: "body"; parameters: WhatsAppParameter[] }
  | { type: "button"; sub_type: string; index: number; parameters: WhatsAppParameter[] };

export type WhatsAppParameter =
  | { type: "text"; text: string }
  | { type: "currency"; currency: { fallback_value: string; code: string; amount_1000: number } }
  | { type: "image"; image: { link: string } };

export type WhatsAppMessage = WhatsAppTextMessage | WhatsAppTemplateMessage;

// ─── Message Email ────────────────────────────────────────────────────────────

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// ─── Résultat générique d'un canal ────────────────────────────────────────────

export interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}
