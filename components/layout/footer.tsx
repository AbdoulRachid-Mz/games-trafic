"use client";

import React from "react";
import { ActiveLink } from "@/components/shared/active-link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
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

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "Youtube" },
  ];

  return (
    <footer className="bg-secondary/10 border-t border-border/50 py-16 bg-mesh-9">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
            <ActiveLink href="/" className="flex items-center gap-2 group">
              <div className="p-2 relative rounded-lg group-hover:scale-110 transition-transform">
                <Image
                  src="/icons/icon-128.png"
                  alt="Games-Trafics"
                  width={100}
                  height={100}
                  className="w-24 h-24 aspect-square"
                />
              </div>
            </ActiveLink>

            <p className="text-sm text-white/80 leading-relaxed">
              L&apos;infrastructure gaming complète pour connecter, compétiter et
              monétiser votre passion. Rejoignez l&apos;élite du gaming francophone.
            </p>

            {/* Social */}
            <div className="flex gap-4">
              {socialLinks.map((item, i) => {
                const Icon = item.icon;
                return (
                  <ActiveLink
                    key={i}
                    href={item.href}
                    isShort
                    icon={<Icon className="w-5 h-5" />}
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary text-white border border-border/50 hover:bg-secondary hover:border-primary/50 hover:text-primary transition-all"
                    tooltipContent={item.label}
                    withTooltip
                  />
                );
              })}
            </div>
          </div>

          {/* Sections */}
          {footerLinks.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-bold mb-6 uppercase tracking-wider text-xs text-white">
                {section.title}
              </h3>

              <ul className="space-y-4">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <ActiveLink
                      href={link.href}
                      className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1 group"
                      activeClassName="text-primary font-semibold"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      {link.name}
                    </ActiveLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 bg-primary text-white border-primary/20 text-[10px] font-bold"
            >
              PLATFORME CERTIFIÉE
            </Badge>

            <span className="text-sm text-secondary/80 font-medium">
              © {currentYear} Games-Trafics. Tous droits réservés.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
