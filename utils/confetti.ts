/**
 * Utilitaire pour générer des confettis avec différents paramètres
 * Utilise canvas-confetti pour créer des effets de confettis personnalisables
 */

export interface ConfettiOptions {
  /**
   * Intensité des confettis (nombre de particules)
   * - low: 50 particules
   * - medium: 100 particules
   * - high: 200 particules
   * - extreme: 400 particules
   */
  intensity?: "low" | "medium" | "high" | "extreme"

  /**
   * Angle de départ des confettis (en degrés)
   * 90 = vertical, 45 = diagonal, etc.
   */
  angle?: number

  /**
   * Spread (dispersion) des confettis
   * Plus le nombre est élevé, plus les confettis se dispersent
   */
  spread?: number

  /**
   * Position de départ (x, y) en pourcentage de l'écran
   * x: 0-1 (0 = gauche, 1 = droite)
   * y: 0-1 (0 = haut, 1 = bas)
   */
  origin?: { x: number; y: number }

  /**
   * Couleurs des confettis
   */
  colors?: string[]

  /**
   * Vitesse de départ des confettis
   */
  startVelocity?: number

  /**
   * Gravité appliquée aux confettis
   */
  gravity?: number

  /**
   * Durée de vie des confettis (en ms)
   */
  ticks?: number

  /**
   * Formes des confettis
   */
  shapes?: ("square" | "circle")[]

  /**
   * Taille scalaire des confettis
   */
  scalar?: number

  /**
   * Désactiver le mouvement de rotation
   */
  disableForReducedMotion?: boolean
}

export interface ConfettiPreset {
  name: string
  description: string
  options: ConfettiOptions
}

/**
 * Presets prédéfinis pour différents types de célébrations
 */
export const confettiPresets: Record<string, ConfettiPreset> = {
  success: {
    name: "Succès",
    description: "Explosion de confettis pour célébrer un succès",
    options: {
      intensity: "medium",
      angle: 90,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
      startVelocity: 45,
      gravity: 1,
      ticks: 200,
      scalar: 1.2,
    },
  },

  celebration: {
    name: "Célébration",
    description: "Confettis festifs pour une grande célébration",
    options: {
      intensity: "high",
      angle: 90,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ["#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#3b82f6"],
      startVelocity: 55,
      gravity: 0.8,
      ticks: 300,
      scalar: 1.5,
    },
  },

  fireworks: {
    name: "Feux d'artifice",
    description: "Effet de feux d'artifice avec plusieurs explosions",
    options: {
      intensity: "extreme",
      angle: 60,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      colors: ["#fbbf24", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"],
      startVelocity: 60,
      gravity: 0.5,
      ticks: 400,
      scalar: 1.8,
    },
  },

  rain: {
    name: "Pluie",
    description: "Confettis tombant comme de la pluie",
    options: {
      intensity: "high",
      angle: 90,
      spread: 180,
      origin: { x: 0.5, y: 0 },
      colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"],
      startVelocity: 25,
      gravity: 1.5,
      ticks: 300,
      scalar: 1,
    },
  },

  sides: {
    name: "Côtés",
    description: "Confettis venant des deux côtés",
    options: {
      intensity: "medium",
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ["#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"],
      startVelocity: 45,
      gravity: 1,
      ticks: 200,
      scalar: 1.2,
    },
  },

  subtle: {
    name: "Subtil",
    description: "Effet discret de confettis",
    options: {
      intensity: "low",
      angle: 90,
      spread: 50,
      origin: { x: 0.5, y: 0.7 },
      colors: ["#10b981", "#34d399", "#6ee7b7"],
      startVelocity: 30,
      gravity: 1.2,
      ticks: 150,
      scalar: 0.8,
    },
  },

  gold: {
    name: "Or",
    description: "Confettis dorés pour les moments premium",
    options: {
      intensity: "high",
      angle: 90,
      spread: 80,
      origin: { x: 0.5, y: 0.6 },
      colors: ["#fbbf24", "#f59e0b", "#d97706", "#b45309"],
      startVelocity: 50,
      gravity: 0.9,
      ticks: 250,
      scalar: 1.5,
      shapes: ["square"],
    },
  },
}

/**
 * Convertit les options en format canvas-confetti
 */
function convertOptions(options: ConfettiOptions) {
  const intensityMap = {
    low: 50,
    medium: 100,
    high: 200,
    extreme: 400,
  }

  return {
    particleCount: intensityMap[options.intensity || "medium"],
    angle: options.angle,
    spread: options.spread,
    origin: options.origin,
    colors: options.colors,
    startVelocity: options.startVelocity,
    gravity: options.gravity,
    ticks: options.ticks,
    shapes: options.shapes,
    scalar: options.scalar,
    disableForReducedMotion: options.disableForReducedMotion ?? true,
  }
}

/**
 * Lance des confettis avec les options spécifiées
 */
export async function fireConfetti(options: ConfettiOptions = {}) {
  // Importer dynamiquement canvas-confetti
  const confetti = (await import("canvas-confetti")).default

  const finalOptions = convertOptions({
    intensity: "medium",
    angle: 90,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    startVelocity: 45,
    gravity: 1,
    ticks: 200,
    scalar: 1,
    ...options,
  })

  return confetti(finalOptions)
}

/**
 * Lance des confettis en utilisant un preset
 */
export async function fireConfettiPreset(presetName: keyof typeof confettiPresets) {
  const preset = confettiPresets[presetName]
  if (!preset) {
    console.warn(`Preset "${presetName}" not found, using default`)
    return fireConfetti()
  }

  return fireConfetti(preset.options)
}

/**
 * Lance des confettis depuis les deux côtés
 */
export async function fireConfettiFromSides(options: ConfettiOptions = {}) {
  const confetti = (await import("canvas-confetti")).default

  const defaults = {
    intensity: "medium",
    angle: 60,
    spread: 55,
    startVelocity: 45,
    gravity: 1,
    ticks: 200,
    scalar: 1.2,
    ...options,
  }

  // Côté gauche
  await confetti(
    convertOptions({
      ...defaults,
      origin: { x: 0, y: 0.6 },
      intensity: defaults.intensity as "low" | "medium" | "high" | "extreme",
    }),
  )

  // Côté droit
  await confetti(
    convertOptions({
      ...defaults,
      angle: 120,
      origin: { x: 1, y: 0.6 },
      intensity: defaults.intensity as "low" | "medium" | "high" | "extreme",
    }),
  )
}

/**
 * Lance une séquence de confettis (feux d'artifice)
 */
export async function fireConfettiSequence(count = 3, delay = 200, options: ConfettiOptions = {}) {
  const promises = []

  for (let i = 0; i < count; i++) {
    promises.push(
      new Promise((resolve) => {
        setTimeout(() => {
          fireConfetti(options).then(resolve)
        }, i * delay)
      }),
    )
  }

  return Promise.all(promises)
}

/**
 * Lance des confettis en continu pendant une durée spécifiée
 */
export async function fireConfettiContinuous(duration = 3000, interval = 100, options: ConfettiOptions = {}) {
  const confetti = (await import("canvas-confetti")).default
  const end = Date.now() + duration

  const frame = () => {
    confetti(
      convertOptions({
        intensity: "low",
        ...options,
      }),
    )

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

/**
 * Lance des confettis réalistes (effet de gravité naturelle)
 */
export async function fireRealisticConfetti(options: ConfettiOptions = {}) {
  return fireConfetti({
    intensity: "high",
    angle: 90,
    spread: 360,
    startVelocity: 30,
    gravity: 1,
    ticks: 300,
    origin: { x: 0.5, y: 0.3 },
    ...options,
  })
}

/**
 * Lance des confettis en forme de cœur (pour les succès spéciaux)
 */
export async function fireHeartConfetti(options: ConfettiOptions = {}) {
  return fireConfetti({
    intensity: "medium",
    angle: 90,
    spread: 100,
    startVelocity: 40,
    gravity: 0.8,
    ticks: 250,
    colors: ["#ef4444", "#f87171", "#fca5a5", "#fecaca"],
    origin: { x: 0.5, y: 0.5 },
    ...options,
  })
}

/**
 * Arrête tous les confettis en cours
 */
export async function stopConfetti() {
  const confetti = (await import("canvas-confetti")).default
  confetti.reset()
}
