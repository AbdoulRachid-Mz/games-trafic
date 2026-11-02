"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Thomas 'Ghost' Durand",
      role: "Organisateur de Tournois",
      text: "La plateforme a radicalement simplifié notre gestion de brackets. Les paiements automatiques en GTC nous font gagner un temps précieux.",
      avatar: "/icons/avatar-240.png",
      fallback: "TD",
    },
    {
      name: "Sarah 'Nova' Meyer",
      role: "Vendeuse Pro Streamer",
      text: "Ma boutique sur Games-Trafics génère plus de revenus que n'importe quel autre marketplace. La sécurité de l'escrow est un game-changer.",
      avatar: "/icons/avatar-240.png",
      fallback: "SM",
    },
    {
      name: "Marc-Antoine Leblanc",
      role: "Joueur Compétitif",
      text: "Enfin un vrai réseau social pour les gamers. Je peux partager mes clips, trouver une équipe et gagner de l'argent au même endroit.",
      avatar: "/icons/avatar-240.png",
      fallback: "ML",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Ils font confiance à{" "}
            <span className="text-primary italic">notre infrastructure</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Rejoignez des milliers de passionnés qui ont déjà franchi le pas
            vers le gaming professionnel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-secondary/5 border border-border/50 relative flex flex-col"
            >
              <Quote className="absolute top-6 right-8 w-8 h-8 text-primary shadow-sm opacity-10" />

              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-lg font-medium leading-relaxed mb-8 flex-1 italic">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border border-primary/20">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="font-bold">
                    {testimonial.fallback}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
