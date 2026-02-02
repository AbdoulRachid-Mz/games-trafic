"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WelcomeSlide } from "./WelcomeSlide";
import { welcomeSlides } from "@/data/welcome";
import { WelcomeProgress } from "./WelcomeProgress";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTracingContext } from "@/contexts/tracing-context";

export function WelcomeSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragDirection, setDragDirection] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  const { trackPageView, completeExplanation, explanationStates } =
    useTracingContext();

  const circleRadius = 120; // Rayon du cercle
  const totalSlides = welcomeSlides.length;

  // Calculer la position de chaque image sur le cercle
  const getImagePosition = (index: number, currentIndex: number) => {
    const angle =
      (index - currentIndex) * (360 / totalSlides) * (Math.PI / 180);
    const x = Math.sin(angle) * circleRadius;
    const y = -Math.cos(angle) * circleRadius;
    const scale = index === currentIndex ? 1 : 0.7;
    const opacity = index === currentIndex ? 1 : 0.6;
    const zIndex =
      index === currentIndex ? 30 : 20 - Math.abs(index - currentIndex);

    return { x, y, scale, opacity, zIndex };
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (isAnimating) return;

    const swipeThreshold = 50;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0 && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      } else if (info.offset.x < 0 && currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
      }
    }
    markInteraction();
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;

    setIsAnimating(true);
    setDragDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    markInteraction();

    setTimeout(() => setIsAnimating(false), 600);
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    } else {
      completeWelcome();
    }
  };

  const skipWelcome = () => {
    completeWelcome();
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const markInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      completeExplanation("welcome");
    }
  };

  const completeWelcome = () => {
    trackPageView("welcome", { completed: true });
    router.push("/sign-up");
  };

  const isFirstWelcomeVisit = !explanationStates.welcome?.completed;

  // Couleurs premium pour le dégradé
  const getDominantColor = (index: number) => {
    const gradients = [
      "from-primary/20 via-purple-600/20 to-secondary/20",
      "from-purple-600/20 via-blue-600/20 to-indigo-600/20",
      "from-emerald-600/20 via-cyan-600/20 to-blue-600/20",
      "from-amber-600/20 via-orange-600/20 to-red-600/20",
      "from-violet-600/20 via-purple-600/20 to-fuchsia-600/20",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div
      className={cn(
        "h-screen flex flex-col relative overflow-hidden bg-gradient-to-br",
        getDominantColor(currentSlide)
      )}
    >
      {/* Background animé premium */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Particules flottantes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Bouton Sauter */}
      {currentSlide >= 1 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 z-50"
        >
          <Button
            variant="ghost"
            onClick={skipWelcome}
            className="text-sm text-foreground/80 backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 hover:text-foreground"
          >
            Sauter
          </Button>
        </motion.div>
      )}

      {/* Indicateur de première visite */}
      {isFirstWelcomeVisit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-6 left-6 z-50"
        >
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-primary/20">
            🎮 Première visite
          </div>
        </motion.div>
      )}

      {/* Section cercle des images */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Cercle de fond */}
        <motion.div
          className="absolute w-80 h-80 rounded-full border-2 border-primary/10 backdrop-blur-sm"
          animate={{
            rotate: 360,
            scale: [1, 1.02, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity },
          }}
        />

        {/* Conteneur du carousel circulaire */}
        <div className="relative w-80 h-80">
          {welcomeSlides.map((slide, index) => {
            const position = getImagePosition(index, currentSlide);
            const isActive = index === currentSlide;

            return (
              <motion.div
                key={slide.title}
                className="absolute top-1/2 left-1/2 cursor-pointer"
                initial={false}
                animate={{
                  x: position.x,
                  y: position.y,
                  scale: position.scale,
                  opacity: position.opacity,
                  rotate: isActive ? 0 : index > currentSlide ? 15 : -15,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  duration: 0.6,
                }}
                style={{
                  zIndex: position.zIndex,
                  marginLeft: -40, // Half of image width
                  marginTop: -40, // Half of image height
                }}
                onClick={() => goToSlide(index)}
              >
                <motion.div
                  className={cn(
                    "relative w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-2xl",
                    isActive
                      ? "border-primary/50 shadow-primary/20"
                      : "border-white/20 shadow-white/10"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                  />

                  {/* Overlay de brillance */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.div>

                {/* Ligne de connexion entre les images */}
                {index !== currentSlide && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 w-16 h-0.5 bg-primary/30 origin-left"
                    style={{
                      rotate:
                        Math.atan2(position.y, position.x) * (180 / Math.PI),
                      scaleX:
                        Math.sqrt(
                          position.x * position.x + position.y * position.y
                        ) / 80,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </motion.div>
            );
          })}

          {/* Image centrale active avec effet premium */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <div className="relative">
              {/* Halo effect */}
              <motion.div
                className="absolute -inset-8 rounded-full bg-primary/20 blur-xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />

              {/* Image principale */}
              <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl backdrop-blur-sm">
                <Image
                  src={welcomeSlides[currentSlide].image}
                  alt={welcomeSlides[currentSlide].title}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Reflet dynamique */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"
                  animate={{
                    x: [0, 100, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Section contenu texte */}
      <div className="flex-1 flex items-start justify-center pt-6 pb-2">
        <motion.div
          className="w-full max-w-2xl relative overflow-hidden touch-pan-y px-6"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onDragStart={(e, info) => {
            setDragDirection(info.offset.x > 0 ? 1 : -1);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: dragDirection * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dragDirection * 50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={markInteraction}
            >
              <WelcomeSlide {...welcomeSlides[currentSlide]} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      {/* Barre de progression améliorée */}
      <div className="px-6 max-md:px-3 pb-4 max-md:pb-2">
        <WelcomeProgress
          current={currentSlide}
          total={totalSlides}
          onDotClick={goToSlide}
          // className="backdrop-blur-md bg-white/5 rounded-full p-2 border border-white/10"
        />
      </div>

      {/* Contrôles de navigation premium */}
      <div className="p-4 max-md:p-2 pt-2">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0 || isAnimating}
            className="rounded-2xl px-8 max-md:px-4 py-3 backdrop-blur-md bg-white/10 border-white/20 text-secondary hover:bg-white/20 hover:scale-105 transition-transform"
          >
            ← Précédent
          </Button>

          <Button
            onClick={nextSlide}
            disabled={isAnimating}
            className={cn(
              "rounded-2xl px-8 max-md:px-4 py-3 font-semibold backdrop-blur-md border transition-all duration-300 hover:scale-105",
              currentSlide === totalSlides - 1
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500/30 shadow-lg shadow-green-500/25"
                : "bg-gradient-to-r from-primary to-primary/80 text-white border-primary/30 shadow-lg shadow-primary/25"
            )}
          >
            {currentSlide === totalSlides - 1 ? (
              <span className="flex items-center gap-2">🚀 Commencer</span>
            ) : (
              <span className="flex items-center gap-2">Suivant →</span>
            )}
          </Button>
        </div>
      </div>

      {/* Overlay d'explication premium */}
      {isFirstWelcomeVisit && currentSlide === 0 && !hasInteracted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-lg"
          onClick={markInteraction}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-gradient-to-br from-background to-muted/50 p-8 rounded-3xl max-w-sm mx-4 text-center border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="text-5xl mb-4"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              👆
            </motion.div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Explorez la Plateforme
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Faites tourner le carousel pour découvrir toutes les
              fonctionnalités. Chaque image vous emmène vers une nouvelle
              découverte !
            </p>
            <Button
              onClick={markInteraction}
              className="w-full rounded-2xl py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
            >
              ✨ Découvrir maintenant
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
