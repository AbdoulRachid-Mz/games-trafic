import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "GTC",
  }).format(price)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export const generateIdCard = (customNumber: number = 0): string => {
  const prefix = 'GT';
  const timestamp = Date.now().toString().slice(-6); // 6 derniers chiffres du timestamp
  const random = Math.floor(1000 + Math.random() * 9000); // Nombre aléatoire à 4 chiffres
  const number = customNumber.toString().padStart(6, '0'); // Ajoute des zéros au début si besoin
  
  // Retourne l'ID avec un nombre personnalisé si passé, sinon l'ID classique
  return `${prefix}-${timestamp}-${random}-${number}`;
};

export function generateWalletNumber() {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let result = "WLT-"
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatNumber(number: number, locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(number);
}

export function formatCurrency(amount: number, currency: string = 'GTC', locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Formats
export function formatWalletNumber(number: string): string {
  if (number.length <= 8) return number;
  return `${number.slice(0, 4)} ${number.slice(4, 8)} ${number.slice(8, 12)} ${number.slice(12, 16)}`;
}

export function maskWalletNumber(number: string): string {
  if (number.length <= 4) return number;
  const lastFour = number.slice(-4);
  return `•••• •••• •••• ${lastFour}`;
}

// Validation
export function validatePin(pin: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (pin.length < 4) {
    errors.push("Le PIN doit contenir au moins 4 chiffres");
  }

  if (!/^\d+$/.test(pin)) {
    errors.push("Le PIN ne doit contenir que des chiffres");
  }

  // Vérifier les combinaisons courantes
  const commonPins = ["1234", "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999"];
  if (commonPins.includes(pin)) {
    errors.push("Ce PIN est trop commun. Choisissez-en un autre");
  }

  // Vérifier les séquences
  const sequences = ["123", "234", "345", "456", "567", "678", "789", "890"];
  if (sequences.some(seq => pin.includes(seq))) {
    errors.push("Évitez les séquences numériques");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Génération
export function generateSecurePin(): string {
  const numbers = "0123456789";
  let pin = "";
  
  // Éviter les séquences et combinaisons courantes
  do {
    pin = "";
    for (let i = 0; i < 4; i++) {
      pin += numbers[Math.floor(Math.random() * numbers.length)];
    }
  } while (!validatePin(pin).isValid);
  
  return pin;
}

export function generateWalletId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `WLT-${timestamp}-${random}`.toUpperCase().slice(0, 20);
}
