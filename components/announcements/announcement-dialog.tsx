"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Calendar, User, Image as ImageIcon } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { toast } from "sonner";
import { markAnnouncementAsRead } from "@/actions/announcements";

interface AnnouncementDialogProps {
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    images: string[];
    video?: string;
    isPinned: boolean;
    isActive: boolean;
    createdAt: string;
  }>;
  onClose: () => void;
}

export function AnnouncementDialog({ announcements, onClose }: AnnouncementDialogProps) {
  const { user } = useAuthContext();
  // const { markAnnouncementAsRead } = useApp();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const currentAnnouncement = announcements[currentIndex];

  // Passer à l'annonce suivante ou fermer
  const handleNext = async () => {
    if (currentAnnouncement) {
      setLoading(true);
      try {
        await markAnnouncementAsRead(currentAnnouncement.id, user?.id ?? '');
        
        if (currentIndex < announcements.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          handleClose();
        }
      } catch (error) {
        console.error("Erreur lors du marquage de l'annonce:", error);
        toast.error("Erreur lors du marquage de l'annonce");
      } finally {
        setLoading(false);
      }
    }
  };

  // Fermer le dialog
  const handleClose = async () => {
    if (currentAnnouncement && user) {
      try {
        await markAnnouncementAsRead(currentAnnouncement.id, user?.id ?? '');
      } catch (error) {
        console.error("Erreur lors du marquage:", error);
      }
    }
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Fermer automatiquement si plus d'annonces
  useEffect(() => {
    if (announcements.length === 0) {
      onClose();
    }
  }, [announcements.length, onClose]);

  // Ne pas afficher si pas d'annonces
  if (announcements.length === 0 || !currentAnnouncement) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <Dialog open={isVisible} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Header avec compteur */}
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Typography variant="h4" weight="semibold">
                      {currentAnnouncement.title}
                    </Typography>
                    <Badge variant="secondary" className="text-xs">
                      {currentIndex + 1} / {announcements.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(currentAnnouncement.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Administration</span>
                  </div>
                </div>
              </DialogHeader>

              {/* Contenu */}
              <ScrollArea className="max-h-[50vh]">
                <div className="p-6">
                  {/* Images */}
                  {currentAnnouncement.images && currentAnnouncement.images.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentAnnouncement.images.map((image, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative rounded-lg overflow-hidden"
                          >
                            <img
                              src={image}
                              alt={`Annonce ${index + 1}`}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="text-xs">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {index + 1}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vidéo */}
                  {currentAnnouncement.video && (
                    <div className="mb-4">
                      <video
                        controls
                        className="w-full rounded-lg"
                        poster={currentAnnouncement.images?.[0]}
                      >
                        <source src={currentAnnouncement.video} type="video/mp4" />
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                    </div>
                  )}

                  {/* Contenu texte */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Typography 
                      variant="body-base" 
                      className="whitespace-pre-wrap leading-relaxed"
                    >
                      {currentAnnouncement.content}
                    </Typography>
                  </motion.div>
                </div>
              </ScrollArea>

              {/* Footer avec actions */}
              <div className="p-6 pt-4 border-t bg-muted/30">
                <div className="flex items-center justify-between">
                  <Typography variant="caption1" theme="muted">
                    {announcements.length > 1 
                      ? `${announcements.length - currentIndex - 1} annonce(s) restante(s)`
                      : "Dernière annonce"
                    }
                  </Typography>
                  
                  <div className="flex gap-2">
                    {currentIndex < announcements.length - 1 ? (
                      <Button 
                        onClick={handleNext} 
                        className="min-w-[100px]"
                        disabled={loading}
                      >
                        {loading ? "..." : "Suivant"}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleClose} 
                        className="min-w-[100px]"
                        disabled={loading}
                      >
                        {loading ? "..." : "Terminer"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}