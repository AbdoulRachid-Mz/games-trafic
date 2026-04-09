"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { StatsCard } from "@/components/ui/stats-card"
import { useScreenSize } from "@/hooks/use-screen"

type StatsItem = React.ComponentProps<typeof StatsCard>

interface StatsCarouselProps {
  data?: StatsItem[]
  children?: React.ReactNode

  className?: string

  itemsPerView?: {
    mobile?: number
    md?: number
    lg?: number
    xl?: number
  }

  gap?: number

  // 🔥 NEW
  withNavButtons?: boolean
  mode?: "carousel" | "grid" | "auto"
  dragFree?: boolean
  loop?: boolean
  showScrollbar?: boolean

  // fallback skeleton
  loading?: boolean
  skeletonCount?: number
}

export function StatsCarousel({
  data,
  children,
  className,
  itemsPerView = {
    mobile: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
  gap = 12,
  withNavButtons = false,
  showScrollbar = false,
  mode = "carousel",
  dragFree = true,
  loop = false,
  loading = false,
  skeletonCount = 4,
}: StatsCarouselProps) {
  const { isMobile, isTablet, isDesktop, isXLargeScreen } =
    useScreenSize()

  const getItemsPerView = () => {
    if (isMobile) return itemsPerView.mobile ?? 1
    if (isTablet) return itemsPerView.md ?? 2
    if (isDesktop && !isXLargeScreen) return itemsPerView.lg ?? 3
    return itemsPerView.xl ?? 4
  }

  const itemsCount = getItemsPerView()
  const basis = `${100 / itemsCount}%`

  // 🔥 AUTO MODE
  const shouldUseCarousel =
    mode === "carousel" ||
    (mode === "auto" && (isMobile || (data?.length ?? 0) > itemsCount))

  // 🔥 CONTENT BUILDER
  const renderItems = () => {
    if (loading) {
      return Array.from({ length: skeletonCount }).map((_, i) => (
        <div
          key={i}
          className="h-24 w-full animate-pulse rounded-xl bg-muted"
        />
      ))
    }

    if (children) return children

    return data?.map((item, index) => (
      <StatsCard
        key={index}
        {...item}
        // bgType={`gradient-${((index % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6}`}
        className={cn("w-full h-full", item.className)}
      />
    ))
  }

  // 🔥 GRID MODE
  if (!shouldUseCarousel) {
    return (
      <div
        className={cn("grid w-full", className)}
        style={{
          gap: `${gap}px`,
          gridTemplateColumns: `repeat(${itemsCount}, minmax(0, 1fr))`,
        }}
      >
        {renderItems()}
      </div>
    )
  }

  // 🔥 CAROUSEL MODE
  return (
    <div className={cn("relative w-full", className)}>
      <Carousel
        opts={{
          align: "start",
          dragFree,
          loop,
        }}
      >
        <CarouselContent
          style={{
            gap: `${gap}px`,
          }}
        >
          {React.Children.map(renderItems(), (child, index) => (
            <CarouselItem
              key={index}
              style={{
                flex: `0 0 ${basis}`,
                maxWidth: basis,
              }}
            >
              {child}
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* 🔥 NAV BUTTONS */}
        {withNavButtons && (
          <>
            <CarouselPrevious className="left-[-10px]" />
            <CarouselNext className="right-[-10px]" />
          </>
        )}
      </Carousel>
    </div>
  )
}