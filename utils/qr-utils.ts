// utils/qr-utils.ts (mis à jour)
import { TransactionType } from "@/types/transaction-types";

/**
 * QR Data structure versioning to handle future changes
 */
const QR_VERSION = "v2";

export interface TransactionQRData {
    v: string; // version
    t: TransactionType; // type
    id: string; // entity/target id
    a?: number; // optional amount/price
    i?: string; // optional image URL
    m?: Record<string, any>; // optional metadata
}

/**
 * Encodes transaction data into a string for QR code
 */
export function encodeTransactionQR(data: Omit<TransactionQRData, 'v'>): string {
    const payload: TransactionQRData = {
        v: QR_VERSION,
        ...data,
    };
    return `gt-tx:${JSON.stringify(payload)}`;
}

/**
 * Decodes transaction data from a QR string
 */
export function decodeTransactionQR(qrString: string): TransactionQRData | null {
    try {
        if (!qrString.startsWith("gt-tx:")) return null;

        const jsonPart = qrString.replace("gt-tx:", "");
        const data = JSON.parse(jsonPart) as TransactionQRData;

        if (data.v !== QR_VERSION && data.v !== "v1") {
            console.warn("QR Version mismatch", data.v);
        }

        return data;
    } catch (error) {
        console.error("Failed to decode transaction QR:", error);
        return null;
    }
}

/**
 * Validates if the decoded data is a valid transaction payload
 */
export function isValidTransactionQR(data: any): data is TransactionQRData {
    return (
        data &&
        typeof data.v === "string" &&
        typeof data.t === "string" &&
        typeof data.id === "string"
    );
}

// ============================================================================
// EDITION QR — partage & scan d'une édition de tournoi
// ============================================================================

const EDITION_QR_PREFIX = "gt-edition:";
const EDITION_QR_VERSION = "v1";

export interface EditionQRData {
    v: string;
    tournamentId: string;
    editionId: string;
}

/**
 * Encode une édition en payload QR interne (`gt-edition:...`).
 */
export function encodeEditionQR(data: {
    tournamentId: string;
    editionId: string;
}): string {
    const payload: EditionQRData = {
        v: EDITION_QR_VERSION,
        tournamentId: data.tournamentId,
        editionId: data.editionId,
    };
    return `${EDITION_QR_PREFIX}${JSON.stringify(payload)}`;
}

/**
 * Décode un payload QR d'édition. Retourne `null` si le format est invalide.
 */
export function decodeEditionQR(qrString: string): EditionQRData | null {
    if (!qrString.startsWith(EDITION_QR_PREFIX)) return null;

    try {
        const data = JSON.parse(qrString.slice(EDITION_QR_PREFIX.length));
        if (
            !data ||
            typeof data.tournamentId !== "string" ||
            typeof data.editionId !== "string"
        ) {
            return null;
        }

        return {
            v: typeof data.v === "string" ? data.v : EDITION_QR_VERSION,
            tournamentId: data.tournamentId,
            editionId: data.editionId,
        };
    } catch (error) {
        console.error("Failed to decode edition QR:", error);
        return null;
    }
}

/**
 * Résout un chemin d'édition à partir d'un contenu scanné.
 * Accepte un payload interne (`gt-edition:...`) ou une URL d'édition
 * (`https://…/tournaments/{tournamentId}/editions/{editionId}`).
 */
export function resolveEditionPathFromQR(raw: string): string | null {
    const payload = decodeEditionQR(raw);
    if (payload) {
        return `/tournaments/${payload.tournamentId}/editions/${payload.editionId}`;
    }

    try {
        const url = new URL(raw);
        const match = url.pathname.match(
            /^\/tournaments\/([^/]+)\/editions\/([^/]+)/
        );
        if (match) {
            return `/tournaments/${match[1]}/editions/${match[2]}`;
        }
    } catch {
        // Le contenu scanné n'est pas une URL : on ignore.
    }

    return null;
}