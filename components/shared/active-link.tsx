// @/components/shared/active-link.tsx
'use client'

import { useActiveRoute } from '@/hooks/use-active-route'
import Link from 'next/link'
import React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>

interface ActiveLinkProps extends AnchorProps {
  href: string

  exact?: boolean
  activeClassName?: string

  withTooltip?: boolean
  tooltipContent?: string

  isShort?: boolean
  icon?: React.ReactNode

  disabledOnActive?: boolean
}

const isExternalLink = (href: string) => {
  return href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')
}

const ActiveLink = ({
  href,
  children,
  className = '',
  exact = false,
  activeClassName = 'text-primary',
  withTooltip = false,
  tooltipContent,
  isShort = false,
  icon,
  disabledOnActive = true,

  target,
  rel,
  onClick,
  ...rest // 🔥 récupère tous les autres attributs HTML
}: ActiveLinkProps) => {
  const { isActive } = useActiveRoute()

  const active = isActive(href, exact)
  const external = isExternalLink(href)

  const isDisabled = disabledOnActive && active

  const content = (
    <span className="flex items-center gap-2">
      {icon}
      {!isShort && children}
    </span>
  )

  const finalClass = `
    ${className}
    ${active ? activeClassName : ''}
    ${isDisabled ? 'pointer-events-none opacity-60 cursor-default' : ''}
  `

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (isDisabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  // 🔐 sécurité auto pour target=_blank
  const computedRel =
    target === '_blank'
      ? rel ?? 'noopener noreferrer'
      : rel

  const linkElement = external ? (
    <a
      href={href}
      className={finalClass}
      target={target ?? '_blank'}
      rel={computedRel}
      onClick={handleClick}
      {...rest}
    >
      {content}
    </a>
  ) : (
    <Link
      href={isDisabled ? '#' : href}
      className={finalClass}
      onClick={handleClick}
      {...rest}
    >
      {content}
    </Link>
  )

  if (withTooltip && tooltipContent) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkElement}
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkElement
}

export { ActiveLink }