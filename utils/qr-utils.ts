// utils/qr-utils.ts

import { TransactionType } from "@/types/transaction-types";

/**
 * QR Data structure versioning to handle future changes
 */
const QR_VERSION = "v1";

export interface TransactionQRData {
    v: string; // version
    t: TransactionType; // type
    id: string; // entity/target id
    a?: number; // optional amount/price
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

        if (data.v !== QR_VERSION) {
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
