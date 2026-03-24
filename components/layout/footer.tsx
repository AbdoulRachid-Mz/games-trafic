"use client";

import React from "react";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Gamepad2,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Écosystème",
      links: [
        { name: "Tournois", href: "/tournaments" },
        { name: "Marketplace", href: "/marketplace" },
        { name: "Social Hub", href: "/social" },
        { name: "GTC Wallet", href: "/wallet" },
      ],
    },
    {
      title: "Navigation",
      links: [
        { name: "Accueil", href: "/" },
        { name: "À propos", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "Légal",
      links: [
        { name: "Conditions d'utilisation", href: "/terms" },
        { name: "Politique de confidentialité", href: "/privacy" },
        { name: "Mentions légales", href: "/legal" },
      ],
    },
  ];

  return (
    <footer className="bg-secondary/10 border-t border-border/50 py-16 bg-mesh-9">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 relative rounded-lg group-hover:scale-110 transition-transform">
                {/* <Gamepad2 className="w-6 h-6" /> */}
                {/* image logo */}
                  <Image
                  src="/images/icons/app/gt-primary.png"
                  alt="Gamers Trafics"
                  width={100}
                  height={100}
                  // fill={true}
                  className="w-24 h-24 aspect-square" 
                />
              </div>
              {/* <span className="text-xl font-bold tracking-tighter uppercase">
                Gamers Trafics
              </span> */}
            </Link>
            <p className="text-sm text-white/80 leading-relaxed">
              L'infrastructure gaming complète pour connecter, compétiter et
              monétiser votre passion. Rejoignez l'élite du gaming francophone.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary text-white backdrop-blur-md border border-border/50 hover:bg-secondary hover:border-primary/50 hover:text-primary transition-all"
                >
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-bold mb-6 uppercase tracking-wider text-xs text-white">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 bg-primary text-white border-primary/20 text-[10px] font-bold"
            >
              PLATFORME CERTIFIÉE
            </Badge>
            <span className="text-sm text-secondary/80 font-medium">
              © {currentYear} Gamers Trafics. Tous droits réservés.
            </span>
          </div>
          <p className="text-[10px] text-secondary uppercase tracking-widest font-bold">
            BUILD WITH ❤️ FOR THE COMMUNITY
          </p>
        </div>
      </div>
    </footer>
  );
}
