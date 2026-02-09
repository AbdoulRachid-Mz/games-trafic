// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import "dotenv/config";
// import * as schema from "@/database/schema";
// import { eq, inArray, sql } from "drizzle-orm";

// const resetDb = true;

// const generateId = schema.generateId;

// const client = postgres(process.env.DATABASE_URL!, {
//   max: 1,
// });
// const db = drizzle(client, { schema });

// const log = (msg: string) => console.log(`🌱 ${msg}`);

// async function main() {
//   log("Démarrage du seed complet...");

//   // -----------------------------------------------------
//   // 1. Réinitialisation complète
//   // -----------------------------------------------------
//   if (resetDb) {
//     log("Reset de la base...");
    
//     const tables = [
//       "announcement_reads", "announcements", "theme_purchases", "user_traces", "claims",
//       "search_history", "push_subscriptions", "notifications", "interactions", 
//       "group_members", "messages", "groups", "posts", "game_item_requests", "game_items",
//       "games", "matches", "phase_sub_groups", "phase_groups", "tournament_phases",
//       "tournament_members", "team_members", "orders", "products", "entity_categories",
//       "categories", "shops", "vip_subscriptions", "wallet_transactions", "user_wallets",
//       "themes", "tournaments", "teams", "users", "app_settings", "blogs", "services", 
//       "guides", "guide_steps", "account", "session", "verification", "viewers"
//     ];

//     for (const table of tables) {
//       await client`TRUNCATE TABLE ${client(table)} RESTART IDENTITY CASCADE`;
//     }
    
//     log("Reset terminé.");
//   }

//   // -----------------------------------------------------
//   // 2. App Settings
//   // -----------------------------------------------------
//   log("Insertion des paramètres de l'application...");
  
//   await db.insert(schema.appSettings).values({
//     id: generateId(),
//     maxProductsRegular: 5,
//     maxProductsVip: 20,
//     maxShopsRegular: 1,
//     maxShopsVip: 5,
//     maxTournamentsRegular: 1,
//     maxTournamentsVip: 5,
//     storyDurationHours: 48,
//     maxStoriesPerDayRegular: 3,
//     maxStoriesPerDayVip: 10,
//     transactionFeePercentage: "0.001",
//     purchaseFeePercentage: "0.01",
//     depositFeePercentage: "0.00",
//     withdrawalFeePercentage: "0.02",
//     transferFeePercentage: "0.005",
//     tournamentParticipationFeePercentage: "0.01",
//     gtcToFcfaRate: "500.0",
//     vipMonthlyPrice: "250",
//     vipYearlyPrice: "2500",
//     freeThemesLimitRegular: 2,
//     freeThemesLimitVip: 10,
//     maxThemeCreationsRegular: 0,
//     maxThemeCreationsVip: 5,
//     canVipCreateThemes: true,
//     canVipSellThemes: true,
//     themeCreationFee: "0.0",
//     themeSaleCommissionPercentage: "0.15",
//     maxParticipantsPerTournament: 32,
//     maxCoOrganizersRatio: 0.33,
//     gameItemsEnabled: true,
//     gameItemCommissionPercentage: "0.05",
//     minGameItemRequest: "1.0",
//     maxGameItemRequest: "1000.0",
//     maintenanceMode: false,
//     defaultUserBalance: 250,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   });

//   // -----------------------------------------------------
//   // 3. Users
//   // -----------------------------------------------------
//   log("Insertion des utilisateurs...");

//   const usersInserted = await db
//     .insert(schema.users)
//     .values([
//       {
//         id: generateId(),
//         authUid: "auth_hamani_123",
//         email: "hamani@example.com",
//         emailVerified: true,
//         username: "hamani",
//         fullName: "Hamani Trader",
//         profileImage: "https://example.com/profiles/hamani.jpg",
//         coverImage: "https://example.com/covers/hamani-cover.jpg",
//         bio: "Vendeur professionnel de comptes gaming",
//         website: "https://hamani-store.com",
//         country: "Niger",
//         countryCode: "NE",
//         socialMedia: ["twitter:https://twitter.com/hamani"],
//         phoneNumber: "+22712345678",
//         address: {
//           street: "Rue du Marché",
//           city: "Niamey",
//           state: "Niamey",
//           country: "Niger",
//           postalCode: "12345"
//         },
//         isPublicProfile: true,
//         isVip: true,
//         isAdmin: false,
//         isActive: true,
//         isDeleted: false,
//         isAnonymous: false,
//         role: 'user',
//         banned: false,
//         settings: {
//           language: "fr",
//           currency: "GTC",
//           theme: "dark",
//           notifications: {
//             email: true,
//             push: true,
//             sms: false
//           }
//         },
//         accountTypes: ["SELLER", "BUYER"],
//         level: "A",
//         shopsCreatedCount: 1,
//         tournamentsCreatedCount: 0,
//         postsCreatedCount: 5,
//         metadata: {},
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         id: generateId(),
//         authUid: "auth_player1_456",
//         email: "player1@example.com",
//         emailVerified: true,
//         username: "player1",
//         fullName: "Player One",
//         profileImage: "https://example.com/profiles/player1.jpg",
//         bio: "Joueur passionné de eFootball",
//         country: "Côte d'Ivoire",
//         countryCode: "CI",
//         isPublicProfile: true,
//         isVip: false,
//         isAdmin: false,
//         isActive: true,
//         isDeleted: false,
//         isAnonymous: false,
//         role: 'user',
//         banned: false,
//         settings: {
//           language: "fr",
//           currency: "GTC",
//           theme: "light"
//         },
//         accountTypes: ["BUYER"],
//         level: "B",
//         shopsCreatedCount: 0,
//         tournamentsCreatedCount: 0,
//         postsCreatedCount: 2,
//         metadata: {},
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         id: generateId(),
//         authUid: "auth_organizer_789",
//         email: "orga@example.com",
//         emailVerified: true,
//         username: "organizer",
//         fullName: "Tournament Master",
//         profileImage: "https://example.com/profiles/organizer.jpg",
//         bio: "Organisateur de tournois gaming",
//         country: "Sénégal",
//         countryCode: "SN",
//         isPublicProfile: true,
//         isVip: false,
//         isAdmin: false,
//         isActive: true,
//         isDeleted: false,
//         isAnonymous: false,
//         role: 'user',
//         banned: false,
//         settings: {
//           language: "fr",
//           currency: "GTC",
//           theme: "dark"
//         },
//         accountTypes: ["TOURNAMENT_ORGANIZER"],
//         level: "A",
//         shopsCreatedCount: 0,
//         tournamentsCreatedCount: 1,
//         postsCreatedCount: 10,
//         metadata: {},
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         id: generateId(),
//         authUid: "auth_admin_999",
//         email: "admin@example.com",
//         emailVerified: true,
//         username: "admin",
//         fullName: "Administrator",
//         isAdmin: true,
//         isPublicProfile: true,
//         isVip: true,
//         isActive: true,
//         isDeleted: false,
//         isAnonymous: false,
//         role: 'admin',
//         banned: false,
//         settings: {
//           language: "fr",
//           currency: "GTC",
//           theme: "system"
//         },
//         accountTypes: ["BUYER", "SELLER", "TRADER", "TOURNAMENT_ORGANIZER", "VIP"],
//         level: "A",
//         shopsCreatedCount: 0,
//         tournamentsCreatedCount: 0,
//         postsCreatedCount: 0,
//         metadata: {},
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const [hamani, player1, organizer, admin] = usersInserted;

//   // -----------------------------------------------------
//   // 4. Sessions
//   // -----------------------------------------------------
//   log("Insertion des sessions utilisateur...");

//   await db.insert(schema.session).values([
//     {
//       id: generateId(),
//       userId: hamani.id,
//       token: "session_token_hamani_123",
//       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//       ipAddress: "192.168.1.1",
//       userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: generateId(),
//       userId: player1.id,
//       token: "session_token_player1_456",
//       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//       ipAddress: "192.168.1.2",
//       userAgent: "Mozilla/5.0 (Android 12; Mobile; rv:68.0) Gecko/68.0 Firefox/96.0",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 5. Accounts
//   // -----------------------------------------------------
//   log("Insertion des comptes d'authentification...");

//   await db.insert(schema.account).values([
//     {
//       id: generateId(),
//       userId: hamani.id,
//       accountId: "hamani_local",
//       providerId: "local",
//       accessToken: "access_token_hamani",
//       refreshToken: "refresh_token_hamani",
//       password: "hashed_password_hamani",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: generateId(),
//       userId: player1.id,
//       accountId: "player1_local",
//       providerId: "local",
//       accessToken: "access_token_player1",
//       refreshToken: "refresh_token_player1",
//       password: "hashed_password_player1",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 6. User Wallets
//   // -----------------------------------------------------
//   log("Insertion des portefeuilles...");

//   const walletsInserted = await db
//     .insert(schema.userWallets)
//     .values([
//       {
//         id: generateId(),
//         userId: hamani.id,
//         pinHash: "hashed_pin_123",
//         balance: "1500.00",
//         isActive: true,
//         identityDocumentType: "PASSPORT",
//         verificationStatus: "VERIFIED",
//         verifiedAt: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         id: generateId(),
//         userId: player1.id,
//         pinHash: "hashed_pin_456",
//         balance: "500.00",
//         isActive: true,
//         verificationStatus: "PENDING",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         id: generateId(),
//         userId: organizer.id,
//         pinHash: "hashed_pin_789",
//         balance: "2000.00",
//         isActive: true,
//         verificationStatus: "VERIFIED",
//         verifiedAt: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const [hamaniWallet, player1Wallet, organizerWallet] = walletsInserted;

//   // -----------------------------------------------------
//   // 7. Wallet Transactions
//   // -----------------------------------------------------
//   log("Insertion des transactions...");

//   const transactionsInserted = await db
//     .insert(schema.walletTransactions)
//     .values([
//       {
//         id: generateId(),
//         walletId: hamaniWallet.id,
//         fromUserId: hamani.id,
//         amount: "1000.00",
//         fees: "10.00",
//         netAmount: "990.00",
//         balanceAfter: "1490.00",
//         currency: "GTC",
//         type: "DEPOSIT",
//         status: "COMPLETED",
//         description: "Dépôt initial",
//         metadata: { paymentMethod: "orange_money", reference: "OM12345" },
//         createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       },
//       {
//         id: generateId(),
//         walletId: player1Wallet.id,
//         fromUserId: player1.id,
//         amount: "500.00",
//         fees: "5.00",
//         netAmount: "495.00",
//         balanceAfter: "495.00",
//         currency: "GTC",
//         type: "DEPOSIT",
//         status: "COMPLETED",
//         description: "Dépôt initial",
//         metadata: { paymentMethod: "mtn_momo", reference: "MM67890" },
//         createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
//       },
//       {
//         id: generateId(),
//         walletId: player1Wallet.id,
//         fromUserId: player1.id,
//         toUserId: hamani.id,
//         amount: "150.00",
//         fees: "0.00",
//         netAmount: "150.00",
//         balanceAfter: "345.00",
//         currency: "GTC",
//         type: "PURCHASE",
//         status: "COMPLETED",
//         description: "Achat compte eFootball niveau 90",
//         metadata: { productTitle: "Compte eFootball Niveau 90" },
//         createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       },
//       {
//         id: generateId(),
//         walletId: hamaniWallet.id,
//         fromUserId: player1.id,
//         toUserId: hamani.id,
//         amount: "150.00",
//         fees: "1.50",
//         netAmount: "148.50",
//         balanceAfter: "1638.50",
//         currency: "GTC",
//         type: "PURCHASE",
//         status: "COMPLETED",
//         description: "Vente compte eFootball niveau 90",
//         metadata: { productTitle: "Compte eFootball Niveau 90" },
//         createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       },
//       {
//         id: generateId(),
//         walletId: hamaniWallet.id,
//         fromUserId: hamani.id,
//         amount: "250.00",
//         fees: "0.00",
//         netAmount: "250.00",
//         balanceAfter: "1388.50",
//         currency: "GTC",
//         type: "VIP_SUBSCRIPTION",
//         status: "COMPLETED",
//         description: "Abonnement VIP mensuel",
//         metadata: { planType: "MONTHLY" },
//         createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
//       }
//     ])
//     .returning();

//   const [deposit1, deposit2, purchaseDebit, purchaseCredit, vipPurchase] = transactionsInserted;

//   // -----------------------------------------------------
//   // 8. VIP Subscriptions
//   // -----------------------------------------------------
//   log("Insertion des abonnements VIP...");

//   await db.insert(schema.vipSubscriptions).values({
//     id: generateId(),
//     userId: hamani.id,
//     planType: "MONTHLY",
//     status: "ACTIVE",
//     startDate: new Date(vipPurchase.createdAt!),
//     endDate: new Date(vipPurchase.createdAt!.getTime() + 30 * 24 * 60 * 60 * 1000),
//     autoRenew: true,
//     pricePaid: vipPurchase.amount,
//     currency: "GTC",
//     transactionId: vipPurchase.id,
//     activeBenefits: ["product_limit_20", "shop_limit_5", "lower_fees"],
//     createdAt: vipPurchase.createdAt,
//     updatedAt: new Date(),
//   });

//   // -----------------------------------------------------
//   // 9. Themes
//   // -----------------------------------------------------
//   log("Insertion des thèmes...");

//   const themesInserted = await db
//     .insert(schema.themes)
//     .values([
//       {
//         id: generateId(),
//         creatorId: admin.id,
//         name: "Dark Pro",
//         description: "Thème sombre professionnel et élégant.",
//         isPremium: true,
//         price: "50.00",
//         thumbnail: "https://example.com/themes/dark-pro.jpg",
//         previewImages: [
//           "https://example.com/themes/dark-pro-1.jpg",
//           "https://example.com/themes/dark-pro-2.jpg"
//         ],
//         config: {
//           colors: { primary: "#1a1a1a", secondary: "#333333", accent: "#007bff", background: "#0a0a0a", text: "#ffffff" },
//           fonts: { primary: "Inter", secondary: "Arial" },
//           layout: { header: "fixed", sidebar: "collapsible", footer: "simple" }
//         },
//         category: "Professional",
//         tags: ["dark", "professional", "modern"],
//         downloads: 150,
//         viewCount: 450,
//         isActive: true,
//         isPublic: true,
//         isCopy: false,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         id: generateId(),
//         creatorId: admin.id,
//         name: "Gaming Light",
//         description: "Thème gaming clair et dynamique",
//         isPremium: false,
//         price: "0.00",
//         thumbnail: "https://example.com/themes/gaming-light.jpg",
//         config: {
//           colors: { primary: "#ff6b35", secondary: "#4ecdc4", accent: "#45b7d1", background: "#f8f9fa", text: "#2c3e50" },
//           fonts: { primary: "Poppins", secondary: "Roboto" }
//         },
//         category: "Gaming",
//         tags: ["gaming", "light", "colorful"],
//         downloads: 30,
//         viewCount: 300,
//         isActive: true,
//         isPublic: true,
//         isCopy: false,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const [darkTheme, lightTheme] = themesInserted;

//   // -----------------------------------------------------
//   // 10. Shops
//   // -----------------------------------------------------
//   log("Insertion des boutiques...");

//   const shopsInserted = await db
//     .insert(schema.shops)
//     .values([
//       {
//         id: generateId(),
//         ownerId: hamani.id,
//         name: "Hamani Pro Gaming",
//         description: "La meilleure source de comptes et items gaming premiums.",
//         profileImage: "https://example.com/shops/hamani-pro.jpg",
//         coverImage: "https://example.com/shops/hamani-cover.jpg",
//         phoneNumber: "+22712345678",
//         country: "Niger",
//         address: { city: "Niamey" },
//         website: "https://hamani-store.com",
//         socialMedia: [{ platform: "facebook", url: "fb.com/hamani-pro" }],
//         productCount: 3,
//         viewCount: 1200,
//         balance: "500.00",
//         verified: true,
//         featured: true,
//         isActive: true,
//         isVisible: true,
//         themeId: darkTheme.id,
//         notificationSettings: {
//           notifyOnNewOrder: true,
//           channels: ['IN_APP']
//         },
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const hamaniShop = shopsInserted[0];

//   // -----------------------------------------------------
//   // 11. Categories
//   // -----------------------------------------------------
//   log("Insertion des catégories...");

//   const categoriesInserted = await db
//     .insert(schema.categories)
//     .values([
//       {
//         id: generateId(),
//         name: "Jeux Vidéo",
//         description: "Catégorie principale pour tout ce qui est jeux vidéo.",
//         slug: "jeux-video",
//         icon: "gamepad",
//         level: 0,
//         path: "jeux-video",
//         fullPath: "jeux-video",
//         applicableEntities: ["PRODUCT", "POST", "TOURNAMENT"],
//         isFeatured: true,
//         itemCount: 5,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     ])
//     .returning();

//   const jeuxVideoCat = categoriesInserted[0];

//   const subCategories = await db
//     .insert(schema.categories)
//     .values([
//       {
//         id: generateId(),
//         name: "eFootball",
//         description: "Catégorie pour les produits et tournois eFootball.",
//         slug: "efootball",
//         icon: "soccer-ball",
//         parentId: jeuxVideoCat.id,
//         level: 1,
//         path: `${jeuxVideoCat.path}/efootball`,
//         fullPath: "jeux-video/efootball",
//         applicableEntities: ["PRODUCT", "TOURNAMENT"],
//         isFeatured: true,
//         itemCount: 2,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         id: generateId(),
//         name: "FIFA Mobile",
//         description: "Catégorie pour les produits FIFA Mobile.",
//         slug: "fifa-mobile",
//         icon: "mobile-game",
//         parentId: jeuxVideoCat.id,
//         level: 1,
//         path: `${jeuxVideoCat.path}/fifa-mobile`,
//         fullPath: "jeux-video/fifa-mobile",
//         applicableEntities: ["PRODUCT"],
//         isFeatured: false,
//         itemCount: 1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     ])
//     .returning();

//   const [efootballCat, fifaCat] = subCategories;

//   // -----------------------------------------------------
//   // 12. Products
//   // -----------------------------------------------------
//   log("Insertion des produits...");

//   const productsInserted = await db
//     .insert(schema.products)
//     .values([
//       {
//         id: generateId(),
//         shopId: hamaniShop.id,
//         userId: hamani.id,
//         categoryId: efootballCat.id,
//         name: "Compte eFootball Niveau 90",
//         description: "Compte eFootball avec équipe de rêve, 20 légendes, 5M de GP.",
//         price: "150.00",
//         currency: "GTC",
//         images: [
//           "https://example.com/products/efootball-1.jpg",
//           "https://example.com/products/efootball-2.jpg"
//         ],
//         game: "eFootball 2024",
//         platform: "MOBILE",
//         categories: ["efootball", "compte_premium"],
//         status: "VENDU",
//         accountLogin: "pro_player_hamani",
//         encryptedPassword: "encrypted_password_123",
//         accountLevel: "90",
//         accountRank: "Légende",
//         viewCount: 34,
//         deliveredToUserId: player1.id,
//         deliveredAt: new Date(purchaseDebit.createdAt!),
//         isActive: true,
//         isVisible: true,
//         isFeatured: true,
//         isNegotiable: true,
//         createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//         updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       },
//       {
//         id: generateId(),
//         shopId: hamaniShop.id,
//         userId: hamani.id,
//         categoryId: fifaCat.id,
//         name: "Compte FIFA Mobile Équipe 110 OVR",
//         description: "Compte FIFA Mobile avec équipe 110 OVR, joueurs TOTS, 2M de coins.",
//         price: "200.00",
//         currency: "GTC",
//         images: ["https://example.com/products/fifa-1.jpg"],
//         game: "FIFA Mobile",
//         platform: "MOBILE",
//         categories: ["fifa", "compte_premium", "ovr_110"],
//         status: "NON_VENDU",
//         accountLogin: "fifa_player_pro",
//         encryptedPassword: "encrypted_password_456",
//         accountLevel: "65",
//         accountRank: "Maître",
//         viewCount: 178,
//         isActive: true,
//         isVisible: true,
//         isFeatured: false,
//         isNegotiable: false,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const [product1, product2] = productsInserted;

//   // Mise à jour des transactions avec les IDs de produits
//   await db.update(schema.walletTransactions)
//     .set({
//       metadata: { productId: product1.id, productTitle: product1.name },
//     })
//     .where(inArray(schema.walletTransactions.id, [purchaseDebit.id, purchaseCredit.id]));

//   // -----------------------------------------------------
//   // 13. Orders
//   // -----------------------------------------------------
//   log("Insertion des commandes...");
  
//   await db.insert(schema.orders).values([
//     {
//       id: generateId(),
//       productId: product1.id,
//       buyerId: player1.id,
//       shopId: hamaniShop.id,
//       price: product1.price,
//       message: "Livraison rapide demandée.",
//       status: "ACCEPTED",
//       orderType: "PURCHASE",
//       orderedProductId: product1.id,
//       createdAt: new Date(purchaseDebit.createdAt!),
//       updatedAt: new Date(purchaseDebit.createdAt!),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 14. Teams
//   // -----------------------------------------------------
//   log("Insertion des équipes...");

//   const teamsInserted = await db
//     .insert(schema.teams)
//     .values([
//       {
//         id: generateId(),
//         name: "H³ Infinity",
//         logo: "https://example.com/teams/h3inf-logo.png",
//         colors: ["#FF0000", "#0000FF"],
//         country: "Niger",
//         city: "Niamey",
//         foundedYear: 2023,
//         website: "https://h3infinity.com",
//         achievements: ["Champions West Africa Cup 2024", "Finalists Global Tournament 2024"],
//         ranking: 1,
//         division: "Elite",
//         registrationId: "H3INF2024",
//         maxSquadSize: 25,
//         currentSquadSize: 2,
//         homeStadium: "Virtual Arena",
//         preferredFormation: "4-3-3",
//         strategy: "Possession offensive",
//         captainId: hamani.id,
//         viceCaptainId: player1.id,
//         socialMedia: [
//           { platform: "twitter", url: "https://twitter.com/h3infinity" }
//         ],
//         isActive: true,
//         createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const team = teamsInserted[0];

//   // -----------------------------------------------------
//   // 15. Team Members
//   // -----------------------------------------------------
//   log("Insertion des membres d'équipe...");
  
//   await db.insert(schema.teamMembers).values([
//     {
//       id: generateId(),
//       teamId: team.id,
//       userId: hamani.id,
//       role: "CAPTAIN",
//       position: "Attaquant",
//       joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
//       isActive: true,
//     },
//     {
//       id: generateId(),
//       teamId: team.id,
//       userId: player1.id,
//       role: "PLAYER",
//       position: "Milieu",
//       joinedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
//       isActive: true,
//     }
//   ]);

//   // -----------------------------------------------------
//   // 16. Tournaments
//   // -----------------------------------------------------
//   log("Insertion des tournois...");

//   const tournamentsInserted = await db
//     .insert(schema.tournaments)
//     .values([
//       {
//         id: generateId(),
//         organizerId: organizer.id,
//         name: "Infinity Cup 2025",
//         description: "Le plus grand tournoi eFootball en Afrique de l'Ouest.",
//         profileImage: "https://example.com/tournaments/infinity-cup.png",
//         coverImage: "https://example.com/tournaments/infinity-cup-cover.jpg",
//         game: "eFootball 2024",
//         platform: "PLAYSTATION",
//         startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//         endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
//         registrationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
//         maxParticipants: 32,
//         currentParticipants: 2,
//         prizePool: "5000.00",
//         prizeCurrency: "GTC",
//         rules: "Tournoi en équipe, format élimination directe",
//         requirements: "Niveau minimum: Maître",
//         status: "UPCOMING",
//         isPrivate: false,
//         requiresAccessCode: false,
//         viewCount: 150,
//         location: "En ligne",
//         contactEmail: "contact@infinitycup.com",
//         contactPhone: "+221770000000",
//         whatsappGroup: "https://chat.whatsapp.com/infinitycup",
//         socialMedia: ["twitter:https://twitter.com/infinitycup"],
//         themeId: darkTheme.id,
//         isActive: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const tournament = tournamentsInserted[0];

//   // -----------------------------------------------------
//   // 17. Tournament Members
//   // -----------------------------------------------------
//   log("Insertion des membres de tournoi...");

//   const tournamentMembersInserted = await db
//     .insert(schema.tournamentMembers)
//     .values([
//       {
//         id: generateId(),
//         tournamentId: tournament.id,
//         userId: hamani.id,
//         teamId: team.id,
//         isCoOrganizer: false,
//         role: "PARTICIPANT",
//         permissions: [],
//         status: "REGISTERED",
//         score: 0,
//         gameLevel: "Légende",
//         phoneNumber: "+22712345678",
//         clubName: "H³ Infinity",
//         isVerified: true,
//         addedAt: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         id: generateId(),
//         tournamentId: tournament.id,
//         userId: player1.id,
//         teamId: team.id,
//         isCoOrganizer: false,
//         role: "PARTICIPANT",
//         permissions: [],
//         status: "REGISTERED",
//         score: 0,
//         gameLevel: "Maître",
//         phoneNumber: "+22598765432",
//         clubName: "H³ Infinity",
//         isVerified: true,
//         addedAt: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const [tournamentMember1, tournamentMember2] = tournamentMembersInserted;

//   // -----------------------------------------------------
//   // 18. Tournament Structure
//   // -----------------------------------------------------
//   log("Insertion de la structure du tournoi...");

//   const phaseGroupInserted = await db
//     .insert(schema.tournamentPhases)
//     .values({
//       id: generateId(),
//       tournamentId: tournament.id,
//       name: "Phase de Groupes",
//       description: "Phase initiale avec 4 groupes",
//       type: "GROUP_STAGE",
//       order: 1,
//       config: {
//         qualifiedCount: 16,
//         groupsCount: 4,
//         matchesPerGroup: 6,
//         advanceFromGroup: 2
//       },
//       isActive: true,
//       startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     })
//     .returning();

//   const phaseGroup = phaseGroupInserted[0];

//   const groupAInserted = await db
//     .insert(schema.phaseGroups)
//     .values({
//       id: generateId(),
//       phaseId: phaseGroup.id,
//       name: "Groupe A",
//       description: "Premier groupe de la phase de poules",
//       order: 1,
//       groupType: "ROUND_ROBIN",
//       config: {
//         matchesPerParticipant: 1,
//         advanceCount: 2,
//         seeding: 'RANDOM'
//       },
//       isCompleted: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     })
//     .returning();

//   const groupA = groupAInserted[0];

//   const subGroupAInserted = await db
//     .insert(schema.phaseSubGroups)
//     .values({
//       id: generateId(),
//       groupId: groupA.id,
//       name: "Sous-groupe A1",
//       description: "Premier sous-groupe du groupe A",
//       order: 1,
//       participant1Id: tournamentMember1.id,
//       participant2Id: tournamentMember2.id,
//       bracketPosition: "UPPER",
//       bracketRound: 1,
//       bracketMatch: 1,
//       status: "COMPLETED",
//       winnerId: tournamentMember1.id,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     })
//     .returning();

//   const subGroupA = subGroupAInserted[0];

//   await db.insert(schema.matches).values([
//     {
//       id: generateId(),
//       subGroupId: subGroupA.id,
//       matchCode: "GRP-A-M01",
//       round: 1,
//       matchNumber: 1,
//       scheduledTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 1000 * 60 * 60),
//       participant1Id: tournamentMember1.id,
//       participant2Id: tournamentMember2.id,
//       score1: 2,
//       score2: 1,
//       winnerId: tournamentMember1.id,
//       status: "COMPLETED",
//       submittedByUserId: hamani.id,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 19. Games
//   // -----------------------------------------------------
//   log("Insertion des jeux...");

//   const gamesInserted = await db
//     .insert(schema.games)
//     .values([
//       {
//         id: generateId(),
//         name: "eFootball 2024",
//         description: "Le jeu de football de Konami.",
//         profileImage: "https://example.com/games/efootball-2024.jpg",
//         coverImage: "https://example.com/games/efootball-cover.jpg",
//         publisher: "Konami",
//         releaseDate: new Date("2023-09-07"),
//         genre: "Sport",
//         platforms: ["PC", "PLAYSTATION", "XBOX", "MOBILE"],
//         isActive: true,
//         featured: true,
//         popularity: 95,
//         website: "https://efootball.konami.net",
//         minAge: 3,
//         tags: ["football", "sport", "multiplayer"],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const efootballGame = gamesInserted[0];

//   // -----------------------------------------------------
//   // 20. Game Items
//   // -----------------------------------------------------
//   log("Insertion des items de jeu...");

//   const gameItemsInserted = await db
//     .insert(schema.gameItems)
//     .values([
//       {
//         id: generateId(),
//         gameId: efootballGame.id,
//         name: "Coins eFootball",
//         type: "CURRENCY",
//         description: "Monnaie in-game eFootball pour acheter des joueurs.",
//         icon: "coin",
//         priceGtc: "0.01",
//         exchangeRate: "1.0",
//         minOrder: "1.0",
//         maxOrder: "1000.0",
//         availability: "AVAILABLE",
//         processingTime: "24h",
//         isActive: true,
//         featured: false,
//         popularity: 0,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const efootballCoin = gameItemsInserted[0];

//   // -----------------------------------------------------
//   // 21. Game Item Requests
//   // -----------------------------------------------------
//   log("Insertion des requêtes d'items de jeu...");

//   await db.insert(schema.gameItemRequests).values([
//     {
//       id: generateId(),
//       userId: player1.id,
//       gameItemId: efootballCoin.id,
//       quantity: "1000",
//       totalGtc: "10.00",
//       commission: "0.50",
//       gameAccount: "player1_efootball",
//       encryptedPassword: "encrypted_game_password",
//       gameId: efootballGame.id,
//       status: "COMPLETED",
//       transactionId: deposit2.id,
//       processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 22. Posts
//   // -----------------------------------------------------
//   log("Insertion des posts...");

//   const postsInserted = await db
//     .insert(schema.posts)
//     .values([
//       {
//         id: generateId(),
//         authorId: hamani.id,
//         content: "Voici un aperçu de l'équipe que je vends actuellement sur ma boutique. #eFootball #Gaming #Boutique",
//         images: [
//           "https://example.com/posts/efootball-team-1.jpg",
//           "https://example.com/posts/efootball-team-2.jpg"
//         ],
//         isStory: false,
//         isActive: true,
//         createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
//         updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
//       },
//       {
//         id: generateId(),
//         authorId: organizer.id,
//         content: "🚀 L'Infinity Cup 2025 approche ! 32 places disponibles, prize pool de 5000 GTC. Inscriptions ouvertes ! #Tournament #eFootball #Gaming",
//         images: [
//           "https://example.com/posts/tournament-poster.jpg"
//         ],
//         isStory: false,
//         isActive: true,
//         createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//         updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       }
//     ])
//     .returning();
    
//   const [post1, post2] = postsInserted;

//   // -----------------------------------------------------
//   // 23. Groups
//   // -----------------------------------------------------
//   log("Insertion des groupes...");

//   const groupsInserted = await db
//     .insert(schema.groups)
//     .values([
//       {
//         id: generateId(),
//         creatorId: organizer.id,
//         name: "Infinity Cup Participants",
//         description: "Chat officiel pour les participants à l'Infinity Cup 2025.",
//         image: "https://example.com/groups/infinity-chat.jpg",
//         isPrivate: true,
//         createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//         updatedAt: new Date(),
//       }
//     ])
//     .returning();

//   const groupChat = groupsInserted[0];

//   // -----------------------------------------------------
//   // 24. Group Members
//   // -----------------------------------------------------
//   log("Insertion des membres de groupe...");

//   await db.insert(schema.groupMembers).values([
//     {
//       id: generateId(),
//       groupId: groupChat.id,
//       userId: organizer.id,
//       role: "OWNER",
//       joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       updatedAt: new Date(),
//     },
//     {
//       id: generateId(),
//       groupId: groupChat.id,
//       userId: hamani.id,
//       role: "MEMBER",
//       joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       updatedAt: new Date(),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 25. Messages
//   // -----------------------------------------------------
//   log("Insertion des messages...");
  
//   await db.insert(schema.messages).values([
//     {
//       id: generateId(),
//       senderId: organizer.id,
//       groupId: groupChat.id,
//       content: "Bienvenue à tous les participants de l'Infinity Cup 2025 ! Le tournoi commence dans 30 jours.",
//       images: [],
//       read: true,
//       isActive: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//     },
//     {
//       id: generateId(),
//       senderId: hamani.id,
//       groupId: groupChat.id,
//       content: "Content d'être là ! Qui participe à l'Infinity Cup ?",
//       images: [],
//       read: true,
//       isActive: true,
//       createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 26. Interactions
//   // -----------------------------------------------------
//   log("Insertion des interactions...");
  
//   await db.insert(schema.interactions).values([
//     {
//       id: generateId(),
//       userId: hamani.id,
//       entityId: post2.id,
//       entityType: "POST",
//       type: "LIKE",
//       postId: post2.id,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
//     },
//     {
//       id: generateId(),
//       userId: player1.id,
//       entityId: post2.id,
//       entityType: "POST",
//       type: "LIKE",
//       postId: post2.id,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 7200000),
//     },
//     {
//       id: generateId(),
//       userId: player1.id,
//       entityId: hamaniShop.id,
//       entityType: "SHOP",
//       type: "FOLLOW",
//       shopId: hamaniShop.id,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 27. Notifications
//   // -----------------------------------------------------
//   log("Insertion des notifications...");
  
//   await db.insert(schema.notifications).values([
//     {
//       id: generateId(),
//       userId: hamani.id,
//       title: "Nouvelle commande reçue",
//       message: "Vous avez reçu une commande pour le produit 'Compte eFootball Niveau 90' de Player One.",
//       type: "ORDER",
//       linkUrl: `/orders/${product1.id}`,
//       read: false,
//       isActive: true,
//       createdAt: new Date(purchaseDebit.createdAt!),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 28. Theme Purchases
//   // -----------------------------------------------------
//   log("Insertion des achats de thèmes...");
  
//   await db.insert(schema.themePurchases).values({
//     id: generateId(),
//     userId: hamani.id,
//     themeId: darkTheme.id,
//     price: "50.00",
//     createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 120000),
//   });

//   // -----------------------------------------------------
//   // 29. Announcements
//   // -----------------------------------------------------
//   log("Insertion des annonces...");
  
//   const announcementsInserted = await db
//     .insert(schema.announcements)
//     .values([
//       {
//         id: generateId(),
//         authorId: admin.id,
//         title: "Nouvelle fonctionnalité : Tournois",
//         content: "Nous sommes ravis d'annoncer le lancement de notre système de tournois ! Créez et participez à des tournois avec prize pools en GTC.",
//         type: "UPDATE",
//         images: ["https://example.com/announcements/tournaments-feature.jpg"],
//         isActive: true,
//         isPinned: true,
//         createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
//         updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
//       }
//     ])
//     .returning();

//   const announcement1 = announcementsInserted[0];

//   // -----------------------------------------------------
//   // 30. Announcement Reads
//   // -----------------------------------------------------
//   log("Insertion des lectures d'annonces...");
  
//   await db.insert(schema.announcementReads).values([
//     {
//       id: generateId(),
//       announcementId: announcement1.id,
//       userId: hamani.id,
//       readAt: new Date(announcement1.createdAt!.getTime() + 60000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 31. Search History
//   // -----------------------------------------------------
//   log("Insertion de l'historique de recherche...");
  
//   await db.insert(schema.searchHistory).values([
//     {
//       id: generateId(),
//       userId: player1.id,
//       query: "compte efootball",
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 32. Claims
//   // -----------------------------------------------------
//   log("Insertion des réclamations...");
  
//   await db.insert(schema.claims).values([
//     {
//       id: generateId(),
//       userId: player1.id,
//       transactionId: purchaseDebit.id,
//       type: "PRODUCT_ISSUE",
//       title: "Problème de livraison du compte",
//       description: "Le mot de passe fourni pour le compte eFootball semble incorrect.",
//       evidence: "Capture d'écran de l'erreur",
//       status: "PENDING",
//       createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1800000),
//       updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1800000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 33. User Traces
//   // -----------------------------------------------------
//   log("Insertion des traces utilisateur...");
  
//   await db.insert(schema.userTraces).values([
//     {
//       id: generateId(),
//       userId: hamani.id,
//       type: "SIGNIN",
//       entityId: hamani.id,
//       payload: { method: "email/password" },
//       createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 34. Blogs
//   // -----------------------------------------------------
//   log("Insertion des blogs...");
  
//   await db.insert(schema.blogs).values([
//     {
//       id: generateId(),
//       authorId: admin.id,
//       title: "Comment sécuriser vos transactions sur Games-Trafics",
//       content: "Dans cet article, nous allons voir les meilleures pratiques pour sécuriser vos achats et ventes sur notre plateforme...",
//       images: [
//         "https://example.com/blogs/security-1.jpg",
//         "https://example.com/blogs/security-2.jpg"
//       ],
//       isActive: true,
//       createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
//       updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 35. Services
//   // -----------------------------------------------------
//   log("Insertion des services...");
  
//   await db.insert(schema.services).values([
//     {
//       id: generateId(),
//       adminId: admin.id,
//       title: "Service de Vérification de Compte",
//       description: "Un service premium pour vérifier l'authenticité de votre compte gaming avant achat.",
//       icon: "shield-check",
//       isActive: true,
//       createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
//       updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 36. Guides
//   // -----------------------------------------------------
//   log("Insertion des guides...");
  
//   const guidesInserted = await db
//     .insert(schema.guides)
//     .values([
//       {
//         id: generateId(),
//         adminId: admin.id,
//         title: "Guide du Vendeur Débutant",
//         category: "Vente",

//         isActive: true,
//         viewCount: 200,
//         createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//         updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       }
//     ])
//     .returning();

//   const guide = guidesInserted[0];

//   // -----------------------------------------------------
//   // 37. Guide Steps
//   // -----------------------------------------------------
//   log("Insertion des étapes de guide...");
  
//   await db.insert(schema.guideSteps).values([
//     {
//       id: generateId(),
//       guideId: guide.id,
//       order: 1,
//       title: "Créez votre boutique",
//       content: "La première étape est de configurer votre boutique dans votre tableau de bord.",
//       images: [],
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 38. Viewers
//   // -----------------------------------------------------
//   log("Insertion des viewers...");
  
//   await db.insert(schema.viewers).values([
//     {
//       id: generateId(),
//       entityId: product2.id,
//       entityType: "PRODUCT",
//       userId: player1.id,
//       ipAddress: "192.168.1.2",
//       userAgent: "Mozilla/5.0 (Android)",
//       metadata: { device: "mobile", location: "Abidjan, CI" },
//       viewedAt: new Date(Date.now() - 1000),
//     }
//   ]);

//   // -----------------------------------------------------
//   // 39. Push Subscriptions
//   // -----------------------------------------------------
//   log("Insertion des abonnements push...");

//   await db.insert(schema.pushSubscriptions).values([
//     {
//       id: generateId(),
//       userId: hamani.id,
//       endpoint: "https://fcm.googleapis.com/fcm/send/hamani123",
//       p256dh: "p256dh_key_hamani",
//       auth: "auth_key_hamani",
//       createdAt: new Date(),
//     }
//   ]);

//   log("✅ Seed terminé avec succès !");
//   log(`📊 Résumé :
//   - ${usersInserted.length} utilisateurs
//   - ${transactionsInserted.length} transactions
//   - ${productsInserted.length} produits
//   - 1 boutique
//   - 1 équipe
//   - 1 tournoi
//   `);
// }

// main().catch((err) => {
//   console.error("Erreur lors du seeding :", err);
//   process.exit(1);
// });