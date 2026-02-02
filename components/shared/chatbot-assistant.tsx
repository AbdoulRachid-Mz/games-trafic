// components/shared/ai-assistant.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Bot,
  HelpCircle,
  Search,
  TrendingUp,
  Shield,
  MapPin,
  Store,
  Trophy,
  Wallet,
  Package,
  Users,
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BotMessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { assistantService } from "@/lib/ai/assistant-service";
import { useRouter } from "next/navigation";
import { AssistantResponse } from "@/lib/ai/assistant-knowledge";

interface Suggestion {
  label: string;
  query: string;
  icon: any;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  context?: string;
  sources?: AssistantResponse["sources"];
  suggestions?: string[];
  actions?: AssistantResponse["actions"];
}

interface AIAssistantProps {
  context?: "shops" | "tournaments" | "wallet" | "products" | "general";
  welcomeMessage?: string;
  position?: "bottom-right" | "bottom-left";
}

export function AIAssistant({
  context = "general",
  welcomeMessage = "👋 Bonjour ! Je suis votre assistant IA Games Trafics. Je combine nos guides officiels avec mes connaissances pour vous aider. Posez-moi vos questions sur les boutiques, tournois, wallet, ou autre chose !",
  position = "bottom-right",
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: welcomeMessage,
      sender: "bot",
      timestamp: new Date(),
      context: "welcome",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getContextSuggestions = () => {
    const suggestions = {
      shops: [
        {
          icon: Store,
          label: "Créer boutique",
          query: "Comment créer une boutique ?",
        },
        {
          icon: Package,
          label: "Vendre produit",
          query: "Comment vendre un compte de jeu ?",
        },
        {
          icon: Users,
          label: "Gérer commandes",
          query: "Comment gérer les commandes dans ma boutique ?",
        },
        {
          icon: Shield,
          label: "Boutique vérifiée",
          query: "Comment obtenir le badge de boutique vérifiée ?",
        },
      ],
      tournaments: [
        {
          icon: Trophy,
          label: "Organiser tournoi",
          query: "Comment organiser un tournoi ?",
        },
        {
          icon: Users,
          label: "S'inscrire",
          query: "Comment participer à un tournoi ?",
        },
        {
          icon: TrendingUp,
          label: "Prix et récompenses",
          query: "Comment définir les prix d'un tournoi ?",
        },
        {
          icon: Shield,
          label: "Règles et fair-play",
          query: "Quelles sont les règles des tournois ?",
        },
      ],
      wallet: [
        {
          icon: Wallet,
          label: "Déposer argent",
          query: "Comment ajouter de l'argent à mon wallet ?",
        },
        {
          icon: Wallet,
          label: "Retirer gains",
          query: "Comment retirer mes gains ?",
        },
        {
          icon: Shield,
          label: "Sécurité wallet",
          query: "Comment sécuriser mon wallet ?",
        },
        {
          icon: Search,
          label: "Voir transactions",
          query: "Comment voir mon historique de transactions ?",
        },
      ],
      general: [
        {
          icon: Store,
          label: "Boutiques",
          query: "Explique-moi comment fonctionnent les boutiques",
        },
        {
          icon: Trophy,
          label: "Tournois",
          query: "Comment fonctionnent les tournois ?",
        },
        {
          icon: Wallet,
          label: "Wallet",
          query: "À quoi sert le wallet et comment l'utiliser ?",
        },
        {
          icon: BookOpen,
          label: "Guides complets",
          query: "Où trouver des guides détaillés ?",
        },
      ],
    };

    return (
      suggestions[context as keyof typeof suggestions] || suggestions.general
    );
  };

  const handleSendMessage = async (customQuery?: string) => {
    const query = customQuery || input.trim();
    if (!query) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: query,
      sender: "user",
      timestamp: new Date(),
      context,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setIsThinking(true);

    try {
      const aiResponse = await assistantService.generateResponse(query);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.answer,
        sender: "bot",
        timestamp: new Date(),
        context,
        sources: aiResponse.sources,
        suggestions: aiResponse.suggestions,
        actions: aiResponse.actions,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Apprentissage automatique (optionnel)
      assistantService.learnFromInteraction(query, aiResponse);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        sender: "bot",
        timestamp: new Date(),
        context: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsThinking(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    handleSendMessage(query);
  };

  const handleActionClick = (action: {
    text: string;
    url?: string;
    type: "link" | "action" | "guide";
  }) => {
    if (action.url) {
      if (action.type === "guide") {
        router.push(action.url);
        setIsOpen(false);
      } else {
        window.open(action.url, "_blank");
      }
    }
  };

  const suggestions = getContextSuggestions();

  return (
    <>
      {/* Bouton flottant */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed ${
          position === "bottom-left" ? "bottom-6 right-6" : "bottom-6 left-6"
        } z-50`}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg relative"
          onClick={() => setIsOpen(true)}
        >
          <BotMessageSquare className="h-7 w-7" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"
          />
        </Button>
      </motion.div>

      {/* Chatbot Dialog */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 overflow-hidden overflow-y-auto z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`fixed bottom-24 ${
                position === "bottom-right" ? "right-6" : "left-6"
              } w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] z-50`}
            >
              <Card className="h-full flex flex-col p-3 shadow-2xl border-2 border-primary/20">
                <CardHeader className="border-b p-2 bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground">
                          <Sparkles className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Assistant IA
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Smart
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Combinaison guides + connaissances
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 flex flex-col">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id}>
                          {/* Message */}
                          <div
                            className={`flex ${
                              message.sender === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl p-3 ${
                                message.sender === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <Typography variant="body-sm">
                                {message.content}
                              </Typography>
                              <Typography
                                variant="caption2"
                                className={`mt-1 ${
                                  message.sender === "user"
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                            </div>
                          </div>

                          {/* Sources (pour les messages du bot) */}
                          {message.sender === "bot" &&
                            message.sources &&
                            message.sources.length > 0 && (
                              <div className="mt-2 ml-2">
                                <Typography
                                  variant="caption2"
                                  className="text-muted-foreground mb-1"
                                >
                                  Sources utilisées :
                                </Typography>
                                <div className="flex flex-wrap gap-1">
                                  {message.sources
                                    .slice(0, 3)
                                    .map((source, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {source.type === "guide" ? (
                                          <>
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            Guide
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            Base de connaissances
                                          </>
                                        )}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}

                          {/* Actions suggérées */}
                          {message.sender === "bot" &&
                            message.actions &&
                            message.actions.length > 0 && (
                              <div className="mt-3 ml-2">
                                <div className="flex flex-wrap gap-2">
                                  {message.actions
                                    .slice(0, 2)
                                    .map((action, index) => (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() =>
                                          handleActionClick(action)
                                        }
                                      >
                                        {action.text}
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                      </Button>
                                    ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}

                      {/* Indicateur de réflexion */}
                      {isThinking && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
                                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-300" />
                              </div>
                              <Typography
                                variant="caption2"
                                className="text-muted-foreground"
                              >
                                Recherche dans la base de connaissances...
                              </Typography>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Suggestions */}
                  {suggestions.length > 0 &&
                    input === "" &&
                    !isTyping &&
                    !isThinking && (
                      <div className="p-4 border-t">
                        <Typography
                          variant="body-sm"
                          weight="medium"
                          className="mb-2"
                        >
                          💡 Questions fréquentes
                        </Typography>
                        <div className="grid grid-cols-2 gap-2">
                          {suggestions.map((suggestion: Suggestion) => (
                            <Button
                              key={suggestion.label}
                              variant="outline"
                              size="sm"
                              className="h-auto py-2 justify-start text-left hover:bg-primary/5"
                              onClick={() =>
                                handleSuggestionClick(suggestion.query)
                              }
                            >
                              <suggestion.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="text-xs truncate">
                                {suggestion.label}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Input */}
                  <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        placeholder="Posez votre question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1"
                        disabled={isTyping || isThinking}
                      />
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={isTyping || isThinking || !input.trim()}
                      >
                        {isTyping || isThinking ? (
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Envoyer"
                        )}
                      </Button>
                    </div>
                    <Typography
                      variant="caption2"
                      className="text-muted-foreground mt-2 text-center"
                    >
                      🔍 Je recherche à la fois dans nos guides officiels et ma
                      base de connaissances
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
