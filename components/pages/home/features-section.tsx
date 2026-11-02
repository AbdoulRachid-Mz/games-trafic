// components/pages/home/features-section.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  ShoppingBag,
  Users,
  ShieldCheck,
  Zap,
  MessageCircle,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// export default function FeaturesSection() {
//   const categories = [
//     {
//       title: "Tournois & Arène",
//       icon: <Trophy className="w-5 h-5" />, 
//       color: "text-yellow-500",
//       features: [
//         { name: "Brackets Automatisés", desc: "Gestion sans effort des tournois solo et équipe." },
//         { name: "Streaming Intégré", desc: "Diffusez vos matchs directement sur la plateforme." },
//         { name: "Cashprizes Sécurisés", desc: "Distribution automatisée et garantie des prix." },
//       ],
//     },
//     {
//       title: "Marketplace Pro",
//       icon: <ShoppingBag className="w-5 h-5" />, 
//       color: "text-blue-500",
//       features: [
//         { name: "Boutiques Personnalisées", desc: "Créez votre propre espace de vente en quelques clics." },
//         { name: "Système d'Escrow", desc: "Transactions sécurisées avec protection acheteur." },
//         { name: "Items Digitaux", desc: "Trading de skins, monnaies virtuelles et comptes." },
//       ],
//     },
//     {
//       title: "Social & Communauté",
//       icon: <Users className="w-5 h-5" />, 
//       color: "text-purple-500",
//       features: [
//         { name: "Feed Gaming", desc: "Partagez vos victoires et suivez vos créateurs." },
//         { name: "Clubs & Groupes", desc: "Rejoignez ou créez des communautés dédiées." },
//         { name: "Chat Temps Réel", desc: "Communiquez instantanément avec vos contacts." },
//       ],
//     },
//     {
//       title: "Infrastructure & Fin",
//       icon: <ShieldCheck className="w-5 h-5" />, 
//       color: "text-green-500",
//       features: [
//         { name: "Portefeuille GTC", desc: "Gérez vos actifs avec une sécurité bancaire." },
//         { name: "Support 24/7", desc: "Une équipe dédiée pour vous accompagner partout." },
//         { name: "Analytics Avancés", desc: "Suivez vos performances et votre croissance." },
//       ],
//     },
//   ];

//   return (
//     <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background/0 to-background/5">
//       <div className="container mx-auto px-4">
//         <div className="text-center max-w-3xl mx-auto mb-20">
//           <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
//             FONCTIONNALITÉS PREMIUM
//           </Badge>
//           <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
//             Une puissance technologique au service du <span className="text-primary italic">Gaming</span>
//           </h2>
//           <p className="text-lg text-muted-foreground">
//             Nous avons développé des outils professionnels pour tous les acteurs de l'industrie : joueurs, organisateurs et marchands.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {categories.map((category, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.6, delay: index * 0.12 }}
//               className="p-8 rounded-3xl border border-border/30 bg-card/60 backdrop-blur-lg hover:bg-card/80 transition-all"
//             >
//               <div className="flex items-center gap-4 mb-8">
//                 <div className={`p-3 rounded-xl bg-background border border-border shadow-sm ${category.color}`}>
//                   {category.icon}
//                 </div>
//                 <h3 className="text-2xl font-bold">{category.title}</h3>
//               </div>

//               <div className="grid grid-cols-1 gap-6">
//                 {category.features.map((feature, fIdx) => (
//                   <div key={fIdx} className="flex gap-4 group">
//                     <div className="mt-1">
//                       <div className="w-5 h-5 rounded-full border-2 border-primary/20 flex items-center justify-center group-hover:border-primary transition-colors">
//                         <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-20 group-hover:opacity-100 transition-opacity" />
//                       </div>
//                     </div>
//                     <div>
//                       <h4 className="font-bold text-lg mb-1">{feature.name}</h4>
//                       <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           ))}
//         </div>

//         {/* Integration Highlight */}
//         <div className="mt-16 text-center">
//           <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-primary/5 border border-primary/10">
//             <div className="flex -space-x-2">
//               {[Zap, ShieldCheck, LayoutDashboard, MessageCircle].map((Icon, i) => (
//                 <div
//                   key={i}
//                   className="w-10 h-10 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center"
//                 >
//                   <Icon className="w-4 h-4 text-primary" />
//                 </div>
//               ))}
//             </div>
//             <p className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
//               Plus de <span className="text-primary">50+ extensions</span> disponibles
//             </p>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }


export default function FeaturesSection() {
  const categories = [
    {
      title: "Tournois & Arène",
      icon: <Trophy className="w-5 h-5" />,
      color: "text-yellow-500",
      features: [
        {
          name: "Brackets Automatisés",
          desc: "Gestion sans effort des tournois solo et équipe.",
        },
        {
          name: "Streaming Intégré",
          desc: "Diffusez vos matchs directement sur la plateforme.",
        },
        {
          name: "Cashprizes Sécurisés",
          desc: "Distribution automatisée et garantie des prix.",
        },
      ],
    },
    {
      title: "Marketplace Pro",
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "text-blue-500",
      features: [
        {
          name: "Boutiques Personnalisées",
          desc: "Créez votre propre espace de vente en quelques clics.",
        },
        {
          name: "Système d'Escrow",
          desc: "Transactions sécurisées avec protection acheteur.",
        },
        {
          name: "Items Digitaux",
          desc: "Trading de skins, monnaies virtuelles et comptes.",
        },
      ],
    },
    {
      title: "Social & Communauté",
      icon: <Users className="w-5 h-5" />,
      color: "text-purple-500",
      features: [
        {
          name: "Feed Gaming",
          desc: "Partagez vos victoires et suivez vos créateurs.",
        },
        {
          name: "Clubs & Groupes",
          desc: "Rejoignez ou créez des communautés dédiées.",
        },
        {
          name: "Chat Temps Réel",
          desc: "Communiquez instantanément avec vos contacts.",
        },
      ],
    },
    {
      title: "Infrastructure & Fin",
      icon: <ShieldCheck className="w-5 h-5" />,
      color: "text-green-500",
      features: [
        {
          name: "Portefeuille GTC",
          desc: "Gérez vos actifs avec une sécurité bancaire.",
        },
        {
          name: "Support 24/7",
          desc: "Une équipe dédiée pour vous accompagner partout.",
        },
        {
          name: "Analytics Avancés",
          desc: "Suivez vos performances et votre croissance.",
        },
      ],
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-primary border-primary/20 bg-primary/5"
          >
            FONCTIONNALITÉS PREMIUM
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Une puissance technologique au service du{" "}
            <span className="text-primary italic">Gaming</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Nous avons développé des outils professionnels pour tous les acteurs
            de l'industrie : joueurs, organisateurs et marchands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-3xl border border-border/50 bg-secondary/5 hover:bg-secondary/10 transition-all"
            >
              <div className="flex items-center gap-4 mb-8">
                <div
                  className={`p-3 rounded-xl bg-background border border-border shadow-sm ${category.color}`}
                >
                  {category.icon}
                </div>
                <h3 className="text-2xl font-bold">{category.title}</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {category.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex gap-4 group">
                    <div className="mt-1">
                      <div className="w-5 h-5 rounded-full border-2 border-primary/20 flex items-center justify-center group-hover:border-primary transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{feature.name}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integration Highlight */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="flex -space-x-2">
              {[Zap, ShieldCheck, LayoutDashboard, MessageCircle].map(
                (Icon, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                )
              )}
            </div>
            <p className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
              Plus de <span className="text-primary">50+ extensions</span>{" "}
              disponibles
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
