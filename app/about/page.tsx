"use client";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Users, 
  Rocket, 
  Heart, 
  Shield, 
  Gamepad2, 
  Globe, 
  Zap,
  Github,
  Twitter,
  Linkedin,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Utilisateurs", value: "10K+", icon: Users },
  { label: "Tournois", value: "500+", icon: Trophy },
  { label: "Pays", value: "25+", icon: Globe },
  { label: "Matchs", value: "50K+", icon: Zap },
];

const team = [
  {
    name: "Abdoul Rachid",
    role: "Fondateur & Lead Dev",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abdoul",
    bio: "Passionné par l'esport et le développement web, Abdoul a créé Games-Trafics pour centraliser l'expérience de jeu.",
    social: { github: "#", twitter: "#", linkedin: "#" }
  },
  {
    name: "Thomas D.",
    role: "Backend Architect",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas",
    bio: "Expert en systèmes distribués et en performance, assure la fluidité de la plateforme.",
    social: { github: "#", linkedin: "#" }
  },
  {
    name: "Sarah M.",
    role: "UX/UI Designer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    bio: "Crée des interfaces intuitives et premium pour offrir la meilleure expérience utilisateur.",
    social: { twitter: "#", linkedin: "#" }
  }
];

const values = [
  {
    title: "Innovation",
    desc: "Nous repoussons sans cesse les limites du possible dans l'esport.",
    icon: Rocket,
    color: "from-blue-500/20 to-cyan-500/20 text-blue-500"
  },
  {
    title: "Communauté",
    desc: "Le joueur est au centre de toutes nos décisions et développements.",
    icon: Heart,
    color: "from-rose-500/20 to-orange-500/20 text-rose-500"
  },
  {
    title: "Intégrité",
    desc: "Transparence et équité sont le socle de notre plateforme de tournois.",
    icon: Shield,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-500"
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 space-y-32">
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary mb-6">
              À propos de nous
            </Badge>
            <Typography variant="h1" className="text-5xl lg:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground leading-tight">
              Redéfinir l'Esport <br /> pour tous les Joueurs.
            </Typography>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Games-Trafics est la destination ultime pour les compétiteurs, les créateurs et les fans. 
            Nous construisons une plateforme tout-en-un pour gérer vos tournois, votre carrière et vos clips.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2">
              Nous rejoindre <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl font-bold border-border/50 bg-background/50 backdrop-blur-xl">
              Explorer les tournois
            </Button>
          </motion.div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card/30 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-colors duration-500 overflow-hidden group">
                <CardContent className="p-8 text-center space-y-2 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  <stat.icon className="w-8 h-8 mx-auto text-primary opacity-50 mb-2" />
                  <Typography variant="h2" className="text-3xl font-black">{stat.value}</Typography>
                  <Typography variant="body-sm" theme="muted" className="uppercase tracking-widest font-bold">{stat.label}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Mission Section */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Typography variant="h2" className="text-4xl font-black">Notre Vision</Typography>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nous croyons que chaque joueur, quel que soit son niveau ou son support, mérite une infrastructure 
              professionnelle pour exprimer son talent. Games-Trafics n'est pas qu'un site de tournois, 
              c'est un écosystème complet qui valorise chaque action de jeu.
            </p>
            <div className="space-y-4">
              {values.map((v) => (
                <div key={v.title} className="flex gap-6 p-4 rounded-2xl bg-card/40 border border-border/50 hover:bg-card/60 transition-colors">
                  <div className={cn("w-12 h-12 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br", v.color)}>
                    <v.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <Typography variant="body-base" weight="bold">{v.title}</Typography>
                    <Typography variant="body-sm" theme="muted">{v.desc}</Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-square">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <div className="relative h-full rounded-3xl bg-card border border-border/50 shadow-2xl overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <Gamepad2 className="w-32 h-32 text-primary/20 group-hover:scale-110 transition-transform duration-700" />
               </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <Typography variant="h2" className="text-4xl font-black">L'Équipe</Typography>
            <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
              Des passionnés dévoués à construire le futur de l'esport amateur et professionnel.
            </Typography>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="relative space-y-6">
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-card border border-border/50 relative group">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                      <div className="flex gap-4">
                        {member.social.github && <Button size="icon" variant="secondary" className="rounded-xl"><Github className="w-5 h-5" /></Button>}
                        {member.social.twitter && <Button size="icon" variant="secondary" className="rounded-xl"><Twitter className="w-5 h-5" /></Button>}
                        {member.social.linkedin && <Button size="icon" variant="secondary" className="rounded-xl"><Linkedin className="w-5 h-5" /></Button>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Typography variant="h4" className="font-bold">{member.name}</Typography>
                    <Typography variant="body-sm" className="text-primary font-bold uppercase tracking-wider">{member.role}</Typography>
                    <Typography variant="body-base" theme="muted" className="line-clamp-3 italic">
                      "{member.bio}"
                    </Typography>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative rounded-[2.5rem] bg-card border border-border/50 p-12 lg:p-24 overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/5 -z-10" />
          <div className="absolute -top-[50%] -left-[50%] w-full h-full bg-primary/10 blur-[100px] rounded-full" />
          
          <div className="max-w-3xl mx-auto space-y-8 relative">
            <Typography variant="h2" className="text-4xl lg:text-5xl font-black">
              Prêt à rejoindre l'aventure ?
            </Typography>
            <Typography variant="body-lg" theme="muted">
              Que vous soyez un joueur passionné, un organisateur ambitieux ou un partenaire potentiel, 
              Games-Trafics a une place pour vous.
            </Typography>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                Créer un compte
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl font-bold border-border/50 bg-background/50 backdrop-blur-xl">
                Nous contacter
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>
      {children}
    </span>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
