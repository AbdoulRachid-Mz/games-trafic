import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/database/schema";
import { z } from "zod";
import { anonymous } from "better-auth/plugins/anonymous";
import { passkey } from "@better-auth/passkey";
import { lastLoginMethod } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { oneTap } from "better-auth/plugins"; // Ajouter cette ligne
import { migrateAnonymousUserData } from "@/actions/users";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      passkey: schema.passkey,
    },
    // usePlural: true,
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache duration en secondes (5 minutes)
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    modelName: "users",
    fields: {
      name: "fullName",
      image: "profileImage",
      emailVerified: "emailVerified",
    },
    additionalFields: {
      fullName: {
        type: "string",
        required: false,
      },
      // username: {
      //   type: "string",
      //   required: false,
      // },
      authUid: {
        type: "string",
        required: false,
        // defaultValue={auth.}
      },
      profileImage: {
        type: "string",
        required: false,
      },
      coverImage: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      banReason: {
        type: "string",
        required: false,
      },
      lastLoginMethod: {
        type: "string",
        required: false,
      },
      banExpires: {
        type: "date",
        required: false,
      },
      website: {
        type: "string",
        required: false,
      },
      country: {
        type: "string",
        required: false,
      },
      countryCode: {
        type: "string",
        required: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      socialMedia: {
        type: "json",
        required: false,
      },
      address: {
        type: "json",
        required: false,
      },
      isPublicProfile: {
        type: "boolean",
        required: false,
      },
      isAnonymous: {
        type: "boolean",
        required: false,
      },
      isVip: {
        type: "boolean",
        required: false,
      },
      isAdmin: {
        type: "boolean",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: false,
      },
      isDeleted: {
        type: "boolean",
        required: false,
      },
      settings: {
        type: "json",
        required: false,
      },
      accountTypes: {
        type: "string[]",
        required: false,
        validator: {
          input: z.array(
            z.enum(["SELLER", "BUYER", "TRADER", "TOURNAMENT_ORGANIZER", "VIP"])
          ),
        },
      },
      level: {
        type: "string",
        required: false,
        validator: {
          input: z.enum(["A", "B", "C"]),
        },
      },
      shopsCreatedCount: {
        type: "number",
        required: false,
      },
      tournamentsCreatedCount: {
        type: "number",
        required: false,
      },
      postsCreatedCount: {
        type: "number",
        required: false,
      },
      metadata: {
        type: "json",
        required: false,
      },
      createdAt: {
        type: "date",
        required: false,
      },
      updatedAt: {
        type: "date",
        required: false,
      },
      lastLogin: {
        type: "date",
        required: false,
      },
    },
  },
  plugins: [
    admin({
      adminUserIds: process.env.ADMIN_USER_IDS?.split(",") || [],
      impersonationSessionDuration: 60 * 60 * 2, // 2 heures
    }),
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await migrateAnonymousUserData(anonymousUser.user.id, newUser.user.id);
      },
    }),
    lastLoginMethod({
      storeInDatabase: true,
    }),
    passkey(),
    oneTap(),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
