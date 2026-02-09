// transaction utils

import { Palette, ShoppingCart, Trophy, GamepadIcon, Star, Wallet } from "lucide-react";

// getEntityIcon
export function getEntityIcon(type: string) {
    switch (type) {
        case "THEME_PURCHASE":
            return Palette;
        case "PRODUCT_PURCHASE":
            return ShoppingCart;
        case "TOURNAMENT_PARTICIPATION":
            return Trophy;
        case "GAME_ITEM_PURCHASE":
            return GamepadIcon;
        case "VIP_SUBSCRIPTION":
            return Star;
        case "DEPOSIT":
            return Wallet;
        case "WITHDRAWAL":
            return Wallet;
        case "REFUND":
            return Wallet;
        case "TRANSFER":
            return Wallet;
        case "ORDER_PURCHASE":
            return ShoppingCart;
        case "BONUS":
            return Wallet;
        default:
            return ShoppingCart;
    }
}

// getEntityLabel
export function getEntityLabel(type: string) {
    switch (type) {
        case "THEME_PURCHASE":
            return "Thème";
        case "PRODUCT_PURCHASE":
            return "Produit";
        case "TOURNAMENT_PARTICIPATION":
            return "Tournoi";
        case "GAME_ITEM_PURCHASE":
            return "Item";
        case "VIP_SUBSCRIPTION":
            return "Abonnement VIP";
        case "DEPOSIT":
            return "Dépôt";
        case "WITHDRAWAL":
            return "Retrait";
        case "REFUND":
            return "Remboursement";
        case "TRANSFER":
            return "Transfert";
        case "ORDER_PURCHASE":
            return "Commande";
        case "BONUS":
            return "Bonus";
        default:
            return "Article";
    }
}
