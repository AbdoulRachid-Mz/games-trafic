// @/components/docs/guide-assistant.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  Loader2,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getGuideById, getGuideSteps } from "@/actions/guides";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GuideAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guide?: any;
}

export function GuideAssistant({ open, onOpenChange, guide }: GuideAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [guideSteps, setGuideSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (open && guide) {
      loadGuideSteps();
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Bonjour ! Je suis votre assistant pour le guide "${guide.title}". Comment puis-je vous aider ?\n\nJe peux vous :\n• Expliquer les étapes du guide\n• Répondre à vos questions spécifiques\n• Vous guider pas à pas`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, guide]);

  const loadGuideSteps = async () => {
    if (!guide) return;
    try {
      const { data: steps } = await getGuideSteps(guide.id);
      setGuideSteps(steps || []);
    } catch (error) {
      console.error("Error loading guide steps:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response based on context
    setTimeout(() => {
      const response = generateResponse(input, guide, guideSteps, currentStepIndex);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateResponse = (query: string, guide: any, steps: any[], stepIndex: number): string => {
    const lowerQuery = query.toLowerCase();
    
    // Check for step-related questions
    if (lowerQuery.includes("étape") || lowerQuery.includes("step")) {
      if (steps.length > 0) {
        return `Voici les étapes du guide "${guide?.title}":\n\n${steps.map((step, i) => 
          `${i + 1}. ${step.title}${step.content ? ` - ${step.content.substring(0, 100)}...` : ""}`
        ).join("\n")}\n\nQuelle étape souhaitez-vous explorer ?`;
      }
      return "Je n'ai pas encore les détails des étapes pour ce guide. Consultez la page du guide pour plus d'informations.";
    }
    
    // Check for category-specific questions
    if (lowerQuery.includes("transaction") || lowerQuery.includes("paiement")) {
      return "Pour les transactions, vous devez :\n1. Accéder à votre portefeuille\n2. Cliquer sur 'Nouvelle transaction'\n3. Choisir le type de transaction\n4. Saisir le montant\n5. Confirmer avec votre code PIN\n\nBesoin de détails sur une étape spécifique ?";
    }
    
    if (lowerQuery.includes("tournoi") || lowerQuery.includes("tournament")) {
      return "Pour participer à un tournoi :\n1. Explorez les tournois disponibles\n2. Sélectionnez celui qui vous intéresse\n3. Cliquez sur 'S'inscrire'\n4. Payez les frais d'inscription\n5. Préparez-vous pour le match !";
    }
    
    if (lowerQuery.includes("vip") || lowerQuery.includes("abonnement")) {
      return "Le programme VIP offre :\n• Réduction sur les frais de transaction\n• Création de thèmes personnalisés\n• Plus de produits en boutique\n• Support prioritaire\n\nSouhaitez-vous vous abonner ?";
    }
    
    // Default helpful response
    return `Je peux vous aider avec le guide "${guide?.title}".\n\n${guide?.description || "Ce guide vous apprendra à utiliser cette fonctionnalité."}\n\nQue souhaitez-vous savoir ?\n• Les étapes du guide\n• Les prérequis\n• Des conseils pratiques\n\nN'hésitez pas à me poser des questions spécifiques !`;
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => handleSend(), 100);
  };

  const quickActions = [
    { label: "Voir les étapes", value: "Quelles sont les étapes ?" },
    { label: "Prérequis", value: "Quels sont les prérequis ?" },
    { label: "Conseils", value: "Avez-vous des conseils ?" },
    { label: "Erreur", value: "Que faire en cas d'erreur ?" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Assistant virtuel
                {guide && (
                  <Badge variant="outline" className="text-xs">
                    {guide.category}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {guide ? `Guide: ${guide.title}` : "Posez vos questions sur Games Trafic"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-[10px] opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium">Vous</span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length < 3 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Actions rapides
            </p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleQuickAction(action.value)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Posez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}