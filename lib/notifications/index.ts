/**
 * Point d'entrée public — lib/notifications
 * Exporte tout ce dont les autres modules ont besoin.
 */

export {
  dispatchNotification,
  notifyUser,
  notifyUsers,
  notifyInApp,
  areExternalNotificationsEnabled,
} from "./dispatcher";
export { sendEmail, sendBulkEmails } from "./channels/email";
export { sendWhatsAppText, sendWhatsAppTemplate, normalizePhone, verifyWebhook } from "./channels/whatsapp";
export { sendPushToUser, generateVapidKeys } from "./channels/push";
export { renderTemplate } from "./templates";
export type {
  NotificationChannel,
  NotificationEvent,
  NotificationEventType,
  DispatchResult,
  ChannelResult,
  UserNotificationPreferences,
  EmailMessage,
  WhatsAppMessage,
  SendResult,
} from "./types";
export type { RenderedTemplate, TemplateData } from "./templates";
export type { PushPayload, PushPayload as PushNotificationPayload } from "./channels/push";
