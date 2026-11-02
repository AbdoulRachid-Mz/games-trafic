// @/utils/types-label.ts

export const accountTypesLabel = (type: string) => {
    switch (type) {
        case "SELLER":
            return "Vendeur";
        case "BUYER":
            return "Acheteur";
        case "TRADER":
            return "Commerçant";
        case "TOURNAMENT_ORGANIZER":
            return "Organisateur de tournois";
        case "VIP":
            return "VIP";
        default:
            return "Inconnu";
    }
}

export const userLevelLabel = (level: string) => {
    switch (level) {
        case "A":
            return "Niveau A";
        case "B":
            return "Niveau B";
        case "C":
            return "Niveau C";
        default:
            return "Inconnu";
    }
};

export const verificationStatusLabel = (status: string) => {
    switch (status) {
        case "PENDING":
            return "En attente";
        case "VERIFIED":
            return "Vérifié";
        case "REJECTED":
            return "Refusé";
        default:
            return "Inconnu";
    }
};

export const teamRoleLabel = (role: string) => {
    switch (role) {
        case "PLAYER":
            return "Joueur";
        case "COACH":
            return "Entraîneur";
        case "MANAGER":
            return "Manager";
        case "SUBSTITUTE":
            return "Remplaçant";
        case "CAPTAIN":
            return "Capitaine";
        case "VICE_CAPTAIN":
            return "Vice-capitaine";
        default:
            return "Inconnu";
    }
};

export const tournamentStatusLabel = (status: string) => {
    switch (status) {
        case "UPCOMING":
            return "À venir";
        case "LIVE":
            return "En direct";
        case "COMPLETED":
            return "Terminé";
        case "CANCELLED":
            return "Annulé";
        default:
            return "Inconnu";
    }
};

export const tournamentFormatLabel = (format: string) => {
    switch (format) {
        case "ELIMINATION":
            return "Élimination";
        case "GROUP_STAGE":
            return "Phase de groupes";
        case "ROUND_ROBIN":
            return "Toutes rondes";
        case "SWISS":
            return "Système suisse";
        case "KNOCKOUT":
            return "À élimination directe";
        case "CUSTOM":
            return "Personnalisé";
        default:
            return "Inconnu";
    }
};

export const matchStatusLabel = (status: string) => {
    switch (status) {
        case "PENDING":
            return "En attente";
        case "IN_PROGRESS":
            return "En cours";
        case "COMPLETED":
            return "Terminé";
        case "CANCELLED":
            return "Annulé";
        case "PENDING_REVIEW":
            return "En attente de révision";
        case "AWAITING_ADMIN_CONFIRMATION":
            return "En attente de confirmation admin";
        case "DISPUTED":
            return "Contesté";
        default:
            return "Inconnu";
    }
};

export const transactionStatusLabel = (status: string) => {
    switch (status) {
        case "PENDING":
            return "En attente";
        case "COMPLETED":
            return "Terminé";
        case "PROCESSING":
            return "En traitement";
        case "FAILED":
            return "Échoué";
        case "REFUNDED":
            return "Remboursé";
        default:
            return "Inconnu";
    }
};

export const transactionTypeLabel = (type: string) => {
    switch (type) {
        case "PURCHASE":
            return "Achat";
        case "VIP_SUBSCRIPTION":
            return "Abonnement VIP";
        case "GAME_ITEM_PURCHASE":
            return "Achat d'item de jeu";
        case "THEME_PURCHASE":
            return "Achat de thème";
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
        case "TOURNAMENT_PARTICIPATION":
            return "Participation tournoi";
        case "BONUS":
            return "Bonus";
        default:
            return "Inconnu";
    }
};

export const orderStatusLabel = (status: string) => {
    switch (status) {
        case "PENDING":
            return "En attente";
        case "ACCEPTED_BY_SHOP":
            return "Accepté par la boutique";
        case "PROCESSING_BY_ADMIN":
            return "En traitement par l'admin";
        case "COMPLETED":
            return "Terminé";
        case "REJECTED_BY_SHOP":
            return "Refusé par la boutique";
        case "REJECTED_BY_ADMIN":
            return "Refusé par l'admin";
        case "CANCELLED":
            return "Annulé";
        default:
            return "Inconnu";
    }
};

export const participationStatusLabel = (status: string) => {
    switch (status) {
        case "REGISTERED":
            return "Inscrit";
        case "PARTICIPATED":
            return "A participé";
        case "DISQUALIFIED":
            return "Disqualifié";
        case "WINNER":
            return "Gagnant";
        case "ELIMINATED":
            return "Éliminé";
        default:
            return "Inconnu";
    }
};

export const entityTypeLabel = (type: string) => {
    switch (type) {
        case "PRODUCT":
            return "Produit";
        case "POST":
            return "Publication";
        case "SHOP":
            return "Boutique";
        case "TOURNAMENT":
            return "Tournoi";
        case "USER":
            return "Utilisateur";
        case "BLOG":
            return "Blog";
        case "MESSAGE":
            return "Message";
        case "TEAM":
            return "Équipe";
        case "THEME":
            return "Thème";
        case "NEWS":
            return "Actualité";
        case "GROUP":
            return "Groupe";
        case "ANNOUNCEMENT":
            return "Annonce";
        case "SERVICE":
            return "Service";
        case "GUIDE":
            return "Guide";
        case "COMMENT":
            return "Commentaire";
        case "MATCH":
            return "Match";
        case "GAME":
            return "Jeu";
        case "GAME_ITEM":
            return "Item de jeu";
        case "GAMECLIP":
            return "Clip de jeu";
        case "PARTNER":
            return "Partenaire";
        case "EDITION":
            return "Édition";
        default:
            return "Inconnu";
    }
};

export const productStatusLabel = (status: string) => {
    switch (status) {
        case "NON_VENDU":
            return "Non vendu";
        case "RESERVE":
            return "Réservé";
        case "EN_ECHANGE":
            return "En échange";
        case "LIVRE":
            return "Livré";
        case "VENDU":
            return "Vendu";
        case "ANNULER":
            return "Annulé";
        default:
            return "Inconnu";
    }
};

export const interactionTypeLabel = (type: string) => {
    switch (type) {
        case "LIKE":
            return "J'aime";
        case "FOLLOW":
            return "Suivre";
        case "BOOKMARK":
            return "Signet";
        case "VIEW":
            return "Vue";
        case "SHARE":
            return "Partager";
        default:
            return "Inconnu";
    }
};

export const platformLabel = (platform: string) => {
    switch (platform) {
        case "PC":
            return "PC";
        case "PLAYSTATION":
            return "PlayStation";
        case "XBOX":
            return "Xbox";
        case "NINTENDO_SWITCH":
            return "Nintendo Switch";
        case "MOBILE":
            return "Mobile";
        case "VR":
            return "VR";
        case "OTHER":
            return "Autre";
        default:
            return "Inconnu";
    }
};

export const gameItemTypeLabel = (type: string) => {
    switch (type) {
        case "COIN":
            return "Pièces";
        case "ITEM":
            return "Objet";
        case "SKIN":
            return "Skin";
        case "EQUIPMENT":
            return "Équipement";
        case "CURRENCY":
            return "Monnaie";
        default:
            return "Inconnu";
    }
};

export const gameItemStatusLabel = (status: string) => {
    switch (status) {
        case "PENDING":
            return "En attente";
        case "PROCESSING":
            return "En traitement";
        case "COMPLETED":
            return "Terminé";
        case "FAILED":
            return "Échoué";
        case "CANCELLED":
            return "Annulé";
        default:
            return "Inconnu";
    }
};

export const vipPlanTypeLabel = (plan: string) => {
    switch (plan) {
        case "MONTHLY":
            return "Mensuel";
        case "YEARLY":
            return "Annuel";
        case "LIFETIME":
            return "À vie";
        default:
            return "Inconnu";
    }
};

export const vipStatusLabel = (status: string) => {
    switch (status) {
        case "ACTIVE":
            return "Actif";
        case "EXPIRED":
            return "Expiré";
        case "CANCELLED":
            return "Annulé";
        default:
            return "Inconnu";
    }
};

export const groupRoleLabel = (role: string) => {
    switch (role) {
        case "OWNER":
            return "Propriétaire";
        case "ADMIN":
            return "Admin";
        case "MEMBER":
            return "Membre";
        default:
            return "Inconnu";
    }
};

export const announcementTypeLabel = (type: string) => {
    switch (type) {
        case "ANNOUNCEMENT":
            return "Annonce";
        case "NEWS":
            return "Actualité";
        case "UPDATE":
            return "Mise à jour";
        default:
            return "Inconnu";
    }
};

export const traceTypeLabel = (type: string) => {
    switch (type) {
        case "SIGNIN":
            return "Connexion";
        case "SIGNOUT":
            return "Déconnexion";
        case "REGISTER":
            return "Inscription";
        case "NAVIGATION":
            return "Navigation";
        case "PURCHASE":
            return "Achat";
        case "TRANSFER":
            return "Transfert";
        case "DEPOSIT":
            return "Dépôt";
        case "VIEW":
            return "Vue";
        case "LIKE":
            return "J'aime";
        case "FOLLOW":
            return "Suivi";
        case "BOOKMARK":
            return "Signet";
        case "CLAIM":
            return "Réclamation";
        case "ERROR":
            return "Erreur";
        case "EXPLANATION_SHOWN":
            return "Explication affichée";
        case "EXPLANATION_COMPLETED":
            return "Explication terminée";
        case "EXPLANATION_SKIPPED":
            return "Explication ignorée";
        case "UPDATE_SETTINGS":
            return "Mise à jour des paramètres";
        case "OTHER":
            return "Autre";
        case "ACTION":
            return "Action";
        case "REFRESH_DATA":
            return "Actualisation des données";
        case "MARK_ANNOUNCEMENT_READ":
            return "Annonce marquée comme lue";
        case "MARK_ALL_ANNOUNCEMENTS_READ":
            return "Toutes les annonces lues";
        case "MAINTENANCE_MODE_DISABLED":
            return "Mode maintenance désactivé";
        case "MAINTENANCE_MODE_ENABLED":
            return "Mode maintenance activé";
        case "UPDATE_EXCHANGE_RATES":
            return "Mise à jour des taux de change";
        case "EXPLANATION_OPENED":
            return "Explication ouverte";
        default:
            return "Inconnu";
    }
};

export const mediaTypeLabel = (type: string) => {
    switch (type) {
        case "image":
            return "Image";
        case "video":
            return "Vidéo";
        case "document":
            return "Document";
        case "audio":
            return "Audio";
        case "other":
            return "Autre";
        default:
            return "Inconnu";
    }
};

export const mediaStatusLabel = (status: string) => {
    switch (status) {
        case "ACTIVE":
            return "Actif";
        case "PROCESSING":
            return "En traitement";
        case "DELETED":
            return "Supprimé";
        default:
            return "Inconnu";
    }
};

export const mediaPrivacyLabel = (privacy: string) => {
    switch (privacy) {
        case "PUBLIC":
            return "Public";
        case "PRIVATE":
            return "Privé";
        case "FRIENDS":
            return "Amis";
        default:
            return "Inconnu";
    }
};

export const partnerTypeLabel = (type: string) => {
    switch (type) {
        case "SPONSOR":
            return "Sponsor";
        case "MEDIA":
            return "Média";
        case "TECHNOLOGY":
            return "Technologie";
        case "FINANCIAL":
            return "Financier";
        case "ESPORTS":
            return "Esports";
        case "GAMING":
            return "Gaming";
        case "STREAMING":
            return "Streaming";
        case "EQUIPMENT":
            return "Équipement";
        case "FOOD_BEVERAGE":
            return "Restauration";
        case "FASHION":
            return "Mode";
        case "TELECOM":
            return "Télécoms";
        case "SOFTWARE":
            return "Logiciel";
        case "HARDWARE":
            return "Matériel";
        case "PUBLISHER":
            return "Éditeur";
        case "DISTRIBUTOR":
            return "Distributeur";
        case "OTHER":
            return "Autre";
        default:
            return "Inconnu";
    }
};

export const partnershipStatusLabel = (status: string) => {
    switch (status) {
        case "PENDING":
            return "En attente";
        case "ACTIVE":
            return "Actif";
        case "PAUSED":
            return "En pause";
        case "COMPLETED":
            return "Terminé";
        case "CANCELLED":
            return "Annulé";
        case "EXPIRED":
            return "Expiré";
        default:
            return "Inconnu";
    }
};

export const partnershipTierLabel = (tier: string) => {
    switch (tier) {
        case "BRONZE":
            return "Bronze";
        case "SILVER":
            return "Argent";
        case "GOLD":
            return "Or";
        case "PLATINUM":
            return "Platine";
        case "DIAMOND":
            return "Diamant";
        case "EXCLUSIVE":
            return "Exclusif";
        default:
            return "Inconnu";
    }
};

export const financialAccountTypeLabel = (type: string) => {
    switch (type) {
        case "USER_WALLET":
            return "Portefeuille utilisateur";
        case "SHOP_WALLET":
            return "Portefeuille boutique";
        case "PLATFORM_ESCROW":
            return "Séquestre plateforme";
        case "PLATFORM_FEES":
            return "Frais plateforme";
        case "TOURNAMENT_POOL":
            return "Caisse tournoi";
        case "SYSTEM_ADJUSTMENT":
            return "Ajustement système";
        default:
            return "Inconnu";
    }
};
