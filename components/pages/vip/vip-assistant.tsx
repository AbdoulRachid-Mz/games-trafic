"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Send, X, Bot, MessageSquare } from "lucide-react";
import { Typography } from "@/components/ui/typography";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  actions?: { label: string; value: string }[];
}

interface VipAssistantProps {
  onRecommendation: (plan: string) => void;
}

export function VipAssistant({ onRecommendation }: VipAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Bonjour ! Je suis l'IA GT-V2. Je peux vous aider à choisir l'abonnement VIP idéal. Voulez-vous que je vous guide ?",
      actions: [
        { label: "Oui, guidez-moi", value: "start" },
        { label: "Non, je regarde seul", value: "close" },
      ],
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleAction = (value: string, label: string) => {
    // Ajouter la réponse de l'utilisateur
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: label },
    ]);

    // Simuler la réflexion de l'IA
    setTimeout(() => {
      const nextMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      switch (value) {
        case "start":
          nextMessage.content = "Super ! Dites-moi, à quelle fréquence utilisez-vous l'application ?";
          nextMessage.actions = [
            { label: "Tous les jours", value: "daily" },
            { label: "Quelques fois par semaine", value: "weekly" },
            { label: "Rarement", value: "rarely" },
          ];
          break;
        case "close":
          setIsOpen(false);
          return;
        case "daily":
        case "weekly":
          nextMessage.content = "D'accord. Êtes-vous intéressé par la création de contenu (Tournois, Boutiques, Thèmes) ?";
          nextMessage.actions = [
            { label: "Oui, beaucoup !", value: "creator" },
            { label: "Un peu", value: "casual_creator" },
            { label: "Non, juste pour jouer", value: "player" },
          ];
          break;
        case "rarely":
          nextMessage.content = "Pour une utilisation occasionnelle, l'abonnement Mensuel est un bon début pour tester les avantages VIP sans engagement à long terme.";
          nextMessage.actions = [
            { label: "Voir le plan Mensuel", value: "recommend_monthly" },
            { label: "Recommencer", value: "start" },
          ];
          break;
        case "creator":
          nextMessage.content = "Pour un créateur actif comme vous, je recommande vivement l'abonnement **À Vie (Lifetime)**. C'est le plus rentable et vous donne un accès illimité sans soucis de renouvellement.";
          nextMessage.actions = [
            { label: "Voir le plan Lifetime", value: "recommend_lifetime" },
            { label: "C'est trop cher", value: "too_expensive" },
          ];
          break;
        case "casual_creator":
        case "player":
          nextMessage.content = "L'abonnement **Annuel** semble être le meilleur compromis. Vous économisez 2 mois par rapport au mensuel et profitez de tous les avantages.";
          nextMessage.actions = [
            { label: "Voir le plan Annuel", value: "recommend_yearly" },
            { label: "Je préfère payer par mois", value: "recommend_monthly" },
          ];
          break;
        case "too_expensive":
          nextMessage.content = "Je comprends. Dans ce cas, l'abonnement **Annuel** est une excellente alternative. Il est beaucoup plus abordable et offre les mêmes avantages.";
          nextMessage.actions = [
            { label: "Voir le plan Annuel", value: "recommend_yearly" },
          ];
          break;
        case "recommend_monthly":
          onRecommendation("MONTHLY");
          nextMessage.content = "J'ai mis en évidence le plan Mensuel pour vous !";
          break;
        case "recommend_yearly":
          onRecommendation("YEARLY");
          nextMessage.content = "Excellent choix ! Le plan Annuel est sélectionné.";
          break;
        case "recommend_lifetime":
          onRecommendation("LIFETIME");
          nextMessage.content = "Le choix des champions ! Le plan Lifetime est sélectionné.";
          break;
      }

      setMessages((prev) => [...prev, nextMessage]);
    }, 800);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg shadow-primary/30 p-0 bg-gradient-to-r from-primary to-purple-600 hover:scale-105 transition-transform"
              onClick={() => setIsOpen(true)}
            >
              <Bot className="h-7 w-7 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-48px)]"
          >
            <Card className="border-primary/20 shadow-2xl overflow-hidden backdrop-blur-xl bg-background/95">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 p-4 flex flex-row items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Typography variant="h4" className="text-sm font-bold">Assistant VIP</Typography>
                    <Typography variant="body-base" className="text-xs text-muted-foreground">En ligne</Typography>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="p-4 h-[400px] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-primary/20">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`
                        max-w-[85%] rounded-2xl p-3 text-sm
                        ${msg.role === "assistant" 
                          ? "bg-secondary text-secondary-foreground rounded-tl-none" 
                          : "bg-primary text-primary-foreground rounded-tr-none"}
                      `}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                
                {/* Actions buttons */}
                {messages[messages.length - 1].role === "assistant" && messages[messages.length - 1].actions && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {messages[messages.length - 1].actions?.map((action) => (
                      <motion.button
                        key={action.value}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-xs bg-background border border-primary/20 hover:bg-primary/10 text-primary px-3 py-1.5 rounded-full transition-colors"
                        onClick={() => handleAction(action.value, action.label)}
                      >
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
