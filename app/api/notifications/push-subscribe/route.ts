/**
 * API Route : Abonnement Web Push — Games Trafics
 * POST /api/notifications/push-subscribe  — enregistre un abonnement
 * DELETE /api/notifications/push-subscribe — supprime un abonnement
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/database/schema";
import { eq, and } from "drizzle-orm";

// ─── POST — Enregistrer un abonnement ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const [sub] = await db
      .insert(pushSubscriptions)
      .values({
        userId: session.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
      })
      .returning();

    return NextResponse.json({ success: true, id: sub.id }, { status: 201 });
  } catch (err) {
    console.error("[PushSubscribe] POST erreur :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE — Supprimer un abonnement ─────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as { endpoint: string };
    if (!body.endpoint) {
      return NextResponse.json({ error: "endpoint manquant" }, { status: 400 });
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, body.endpoint),
          eq(pushSubscriptions.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[PushSubscribe] DELETE erreur :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
