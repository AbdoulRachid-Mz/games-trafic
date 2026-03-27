// @/components/shared/stats-card-carousel.tsx

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { StatsCard } from "@/components/ui/stats-card"
import { useScreenSize } from "@/hooks/use-screen"

type StatsItem = React.ComponentProps<typeof StatsCard>

interface StatsCarouselProps {
  data: StatsItem[]
  className?: string

  // nombre d'items visibles
  itemsPerView?: {
    mobile?: number
    md?: number
    lg?: number
    xl?: number
  }

  gap?: number // gap entre items
}

export function StatsCarousel({
  data,
  className,
  itemsPerView = {
    mobile: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
  gap = 12,
}: StatsCarouselProps) {
  const { isMobile, isTablet, isDesktop, isXLargeScreen, is2XLargeScreen } =
    useScreenSize()

  const getItemsPerView = () => {
    if (isMobile) return itemsPerView.mobile ?? 1
    if (isTablet) return itemsPerView.md ?? 2
    if (isDesktop && !isXLargeScreen) return itemsPerView.lg ?? 3
    return itemsPerView.xl ?? 4
  }

  const itemsCount = getItemsPerView()

  // largeur dynamique
  const basis = `${100 / itemsCount}%`

  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true, // 👈 swipe fluide
      }}
      className={cn("w-full", className)}
    >
      <CarouselContent
        style={{
          gap: `${gap}px`,
        }}
      >
        {data.map((item, index) => (
          <CarouselItem
            key={index}
            style={{
              flex: `0 0 ${basis}`,
              maxWidth: basis,
            }}
          >
            <StatsCard
              {...item}
              className={cn("w-full h-full", item.className)}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}