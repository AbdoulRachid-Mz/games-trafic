"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Bot, X, HelpCircle } from "lucide-react";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  actions?: { label: string; value: string }[];
}

export function TournamentAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Besoin d’aide ? Je peux expliquer: règles, conditions d’entrée, comment devenir membre, info organisateur. Que souhaitez-vous savoir ?",
      actions: [
        { label: "Règles du tournoi", value: "rules" },
        { label: "Conditions d’entrée", value: "requirements" },
        { label: "Devenir membre", value: "membership" },
        { label: "Organisateur", value: "organizer" },
      ],
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const reply = (value: string, label: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: label }]);
    setTimeout(() => {
      const next: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
      switch (value) {
        case "rules":
          next.content =
            "Les règles définissent le format, le fair-play et les sanctions. Consultez l’onglet Règles pour les détails.";
          break;
        case "requirements":
          next.content =
            "Les conditions d’entrée incluent critères d’âge, rang de jeu, ou frais. Voir ‘Conditions d’entrée’ dans l’Aperçu.";
          break;
        case "membership":
          next.content =
            "Pour devenir membre, utilisez “Demander adhésion”. Les organisateurs approuvent ou rejettent selon les règles.";
          break;
        case "organizer":
          next.content =
            "L’organisateur gère les éditions, les membres et la modération. Ses informations sont affichées dans la barre latérale.";
          break;
      }
      setMessages((prev) => [...prev, next]);
    }, 600);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg shadow-primary/30 p-0 bg-gradient-to-r from-primary to-blue-600"
              onClick={() => setIsOpen(true)}
            >
              <HelpCircle className="h-7 w-7 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-48px)]"
          >
            <Card className="border-primary/20 shadow-2xl overflow-hidden backdrop-blur-xl bg-background/95">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 p-3 flex flex-row items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <Typography variant="h4" className="text-sm font-bold">Assistant Tournoi</Typography>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-3 h-[360px] overflow-y-auto space-y-3">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-2.5 text-xs ${
                        msg.role === "assistant"
                          ? "bg-secondary text-secondary-foreground rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      }`}
                    >
                      {msg.content}
                      {msg.actions && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.actions.map((a) => (
                            <button
                              key={a.value}
                              className="text-xs bg-background border border-primary/20 hover:bg-primary/10 text-primary px-2.5 py-1 rounded-full transition-colors"
                              onClick={() => reply(a.value, a.label)}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={endRef} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
