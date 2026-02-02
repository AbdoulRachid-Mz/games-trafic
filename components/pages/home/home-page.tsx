// components/pages/home/home-page.tsx
"use client";

import React, { useEffect, useState } from "react";
import HeroSection from "./hero-section";
import StatsSection from "./stats-section";
import FeaturesSection from "./features-section";
import ActivityFeedSection from "./activity-feed-section";
import TestimonialsSection from "./testimonials-section";
import CtaSection from "./cta-section";
import { ParallaxBackground } from "./parallax-background";
import { TypingText } from "./typing-text";
import { HomeGameClipsSection } from "@/components/game-clips/home-game-clips-section";
import { ScrollAnimations } from "./scroll-animations";
import { useScreenSize } from "@/hooks/use-screen";
import { motion } from "framer-motion";
import { FloatingElements } from "./floating-elements";
import GamingEcosystemSection from "./gaming-ecosystem-section";
import HowItWorksSection from "./how-it-works-section";
import { Typewriter } from "react-simple-typewriter";
import { PartnersSection } from "./partners-section";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <HomeLoadingSkeleton />;
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full">
      {/* Hero Section - The starting point of the professional gaming experience */}
      <section className="relative z-10">
        <HeroSection />
      </section>

      {/* Game Clips Section - Instant engagement through video highlights */}
      <section className="relative z-10 -mt-8 md:-mt-12">
        <HomeGameClipsSection />
      </section>

      <ScrollAnimations>
        {/* Stats Section - Data-driven trust building */}
        <section className="relative z-10 mt-12 md:mt-20">
          <StatsSection />
        </section>

        {/* Gaming Ecosystem - The core application concept */}
        <section id="ecosystem" className="relative z-10 mt-20 md:mt-32">
          <GamingEcosystemSection />
        </section>

        {/* Features Section - Deep dive into platform capabilities */}
        <section id="features" className="relative z-10 mt-20 md:mt-32">
          <FeaturesSection />
        </section>

        {/* How It Works - Practical guide to getting started */}
        <section className="relative z-10 mt-20 md:mt-32">
          <HowItWorksSection />
        </section>

        {/* Activity Feed - Real-time engagement proof */}
        <section className="relative z-10 mt-20 md:mt-32">
          <ActivityFeedSection />
        </section>

        {/* Testimonials - Community validation */}
        <section className="relative z-10 mt-20 md:mt-32">
          <TestimonialsSection />
        </section>

        {/* Partners - Trusted brands and sponsors */}
        <section className="relative z-10 mt-20 md:mt-32">
          <PartnersSection />
        </section>

        {/* Final CTA - Action-oriented conclusion */}
        <section className="relative z-10 mt-20 md:mt-32 pb-20">
          <CtaSection />
        </section>
      </ScrollAnimations>
    </div>
  );
}

function HomeLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">
          Chargement de votre univers gaming...
        </p>
      </div>
    </div>
  );
}
