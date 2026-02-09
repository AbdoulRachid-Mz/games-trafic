"use client";

// import { subscribeUserToPush } from "@/lib/pwa";

export default function EnablePushButton() {
  return (
    <button
      // onClick={() => subscribeUserToPush()}
      className="px-4 py-2 bg-primary text-white rounded-lg"
    >
      🔔 Activer les notifications
    </button>
  );
}
