Objectif :
Refactoriser entièrement le système de navigation des conversations pour abandonner le format basé sur route dynamique (`/chats/[entityType]/[entityId]`) et migrer vers un système basé sur query params standard :

`/chats?entityType=user&entityId=123`

Contraintes importantes :

* Supprimer toute dépendance directe à `useParams()`
* Utiliser uniquement `useSearchParams()`
* Garder le format interne `chatId = type:id` pour compatibilité backend/state
* Assurer compatibilité mobile + desktop
* Éviter toute régression fonctionnelle

Tâches détaillées :

1. Créer un helper central `getChatFromParams(searchParams)` :

   * Supporte `URLSearchParams`
   * Valide `entityType` (user, group, shop, tournament)
   * Retourne `{ entityType, entityId, chatId }`
   * Gère les valeurs null / invalides proprement

2. Nettoyage global du projet :

   * Supprimer toute utilisation de `useParams()` dans :

     * pages chats
     * layout chats
     * hooks liés aux conversations
   * Supprimer parsing manuel type/id
   * Supprimer dépendances au path `/[entityType]/[entityId]`

3. Refactor des pages :

   * Utiliser `useSearchParams()`
   * Rediriger si params invalides (`router.replace('/chats')`)
   * Supporter navigation dynamique sans reload

4. Refactor du ChatContext :

   * Continuer d'utiliser `chatId`
   * Ne pas dépendre de l’URL directement
   * Synchroniser avec query params

5. Refactor des utils :

   * Adapter `parseChatId` si nécessaire
   * Garder `formatChatId`
   * Centraliser toute logique dans `getChatFromParams`

6. Sidebar & navigation :

   * Navigation vers `/chats?entityType=...&entityId=...`
   * Highlight actif basé sur query params

7. UX & robustesse :

   * Gérer état loading si params absents
   * Éviter flicker UI
   * Éviter double render inutile

Résultat attendu :

* URL propre et standardisée
* Code centralisé et maintenable
* Plus aucune erreur liée aux params en production
* Système scalable pour futures entités (ex: events, posts)


🧠 3. HELPER PRO (LE CŒUR DU SYSTÈME)
// lib/get-chat-from-params.ts

import type { ChatEntityType } from "@/types/chat";

const VALID_TYPES: ChatEntityType[] = [
  "user",
  "group",
  "shop",
  "tournament",
];

export function getChatFromParams(searchParams: URLSearchParams) {
  const entityType = searchParams.get("entityType")?.toLowerCase().trim();
  const entityId = searchParams.get("entityId")?.trim();

  if (!entityType || !entityId) return null;

  if (!VALID_TYPES.includes(entityType as ChatEntityType)) {
    return null;
  }

  return {
    entityType: entityType as ChatEntityType,
    entityId,
    chatId: `${entityType}:${entityId}`,
  };
}
🧹 4. NETTOYAGE GLOBAL (CHECKLIST)
🔥 À supprimer
useParams() ❌
/chats/[entityType]/[entityId] ❌
parsing manuel ❌
✅ À modifier
ChatLayout
const searchParams = useSearchParams();
const chat = getChatFromParams(searchParams);

const hasActiveChat = !!chat;
Page Chat
const searchParams = useSearchParams();
const router = useRouter();

const chat = getChatFromParams(searchParams);

useEffect(() => {
  if (!chat) {
    router.replace("/chats");
  }
}, [chat]);
Sidebar navigation
router.push(`/chats?entityType=${type}&entityId=${id}`);
🎧 5. AUDIO PLAYER (WHATSAPP STYLE 🔥)

👉 Là on va faire propre :

bouton play rond
waveform fake (progress bar smooth)
temps réel
pause auto autres audios
fallback + safe
💎 Composant PRO
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  messageId: string;
  isSent: boolean;
}

export function ChatAudioPlayer({ src, messageId, isSent }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // INIT
  useEffect(() => {
    const audio = document.createElement("audio");
    audio.src = src.replace(".webm", ".mp3"); // fallback
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";

    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () =>
      setProgress((audio.currentTime / audio.duration) * 100);

    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [src]);

  // STOP OTHERS
  useEffect(() => {
    const stop = (e: any) => {
      if (e.detail !== messageId && playing) {
        audioRef.current?.pause();
        setPlaying(false);
      }
    };

    window.addEventListener("chat-audio", stop);
    return () => window.removeEventListener("chat-audio", stop);
  }, [playing]);

  const toggle = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      window.dispatchEvent(
        new CustomEvent("chat-audio", { detail: messageId })
      );
      audioRef.current.play();
    }

    setPlaying(!playing);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl w-[220px]",
        isSent
          ? "bg-[var(--chat-primary)] text-white"
          : "bg-[var(--chat-surface)]"
      )}
    >
      {/* BUTTON */}
      <button
        onClick={toggle}
        className="h-9 w-9 rounded-full flex items-center justify-center bg-black/20"
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* WAVE */}
      <div className="flex-1">
        <div className="h-1 w-full bg-white/30 rounded overflow-hidden">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-[10px] mt-1 opacity-70">
          {format(duration)}
        </div>
      </div>
    </div>
  );
}

function format(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
🔥 BONUS (ULTRA PRO UX)

Tu peux ajouter :

🎙 animation pulse pendant lecture
📶 waveform réelle (avec wavesurfer.js)
⚡ preload intelligent
📥 download auto toggle