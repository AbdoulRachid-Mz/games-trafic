// @/components/shared/mix-border.tsx

import React from "react"
import clsx from "clsx"

export type BorderColorItem = {
  color: string
  size?: string
  order?: number
}

export type BorderSide = {
  /**
   * afficher ou non le coté
   */
  show?: boolean

  /**
   * taille du coté par rapport au parent
   * ex:
   * 100%
   * 80%
   * 50%
   */
  size?: string

  /**
   * epaisseur de la bordure
   */
  thickness?: number

  /**
   * position custom
   */
  inset?: string

  /**
   * couleurs segmentées
   */
  colors: Record<string, BorderColorItem>
}

interface MixBorderProps {
  className?: string

  top?: BorderSide
  bottom?: BorderSide
  left?: BorderSide
  right?: BorderSide

  radius?: number
}

const MixBorder = ({
  className,
  top,
  bottom,
  left,
  right,
  radius = 12,
}: MixBorderProps) => {
  const buildGradient = (
    side?: BorderSide,
    direction: "to right" | "to bottom" = "to right"
  ) => {
    if (!side?.colors) return "transparent"

    const sorted = Object.values(side.colors).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    )

    /**
     * si un seul element sans size
     * => prend 100%
     */
    if (sorted.length === 1 && !sorted[0].size) {
      return sorted[0].color.startsWith("--")
        ? `var(${sorted[0].color})`
        : sorted[0].color
    }

    let current = 0

    const stops = sorted
      .map((item) => {
        const size = item.size || `${100 / sorted.length}%`

        const start = current
        current += parseFloat(size)

        const color = item.color.startsWith("--")
          ? `var(${item.color})`
          : item.color

        return `
          ${color} ${start}%,
          ${color} ${current}%
        `
      })
      .join(",")

    return `linear-gradient(${direction}, ${stops})`
  }

  const renderHorizontal = (
    side?: BorderSide,
    position: "top" | "bottom" = "top"
  ) => {
    if (!side?.show) return null

    return (
      <div
        className={clsx(
          "absolute left-1/2 -translate-x-1/2",
          className
        )}
        style={{
          [position]: side.inset || 0,
          width: side.size || "100%",
          height: side.thickness || 2,

          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,

          background: buildGradient(side, "to right"),
        }}
      />
    )
  }

  const renderVertical = (
    side?: BorderSide,
    position: "left" | "right" = "left"
  ) => {
    if (!side?.show) return null

    return (
      <div
        className={clsx(
          "absolute top-1/2 -translate-y-1/2",
          className
        )}
        style={{
          [position]: side.inset || 0,
          height: side.size || "100%",
          width: side.thickness || 2,

          borderTopLeftRadius: radius,
          borderBottomLeftRadius: radius,

          background: buildGradient(side, "to bottom"),
        }}
      />
    )
  }

  return (
     <div
    className={clsx(
      "absolute inset-0 pointer-events-none overflow-hidden z-0",
      className
    )}
  >
    {renderHorizontal(top, "top")}
    {renderHorizontal(bottom, "bottom")}

    {renderVertical(left, "left")}
    {renderVertical(right, "right")}
  </div>
  )
}

export default MixBorder