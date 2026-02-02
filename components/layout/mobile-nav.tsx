"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingCart, Trophy, MessageSquare, Bell, User, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthContext } from "@/contexts/auth-context"

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuthContext()

  const routes = [
    {
      href: "/",
      label: "Accueil",
      icon: <Home className="mr-2 h-4 w-4" />,
      active: pathname === "/",
    },
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: <ShoppingCart className="mr-2 h-4 w-4" />,
      active: pathname === "/marketplace",
    },
    {
      href: "/tournaments",
      label: "Tournois",
      icon: <Trophy className="mr-2 h-4 w-4" />,
      active: pathname === "/tournaments",
    },
  ]

  const authRoutes = [
    {
      href: "/messages",
      label: "Messages",
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      active: pathname === "/messages",
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: <Bell className="mr-2 h-4 w-4" />,
      active: pathname === "/notifications",
    },
    {
      href: "/profile",
      label: "Mon profil",
      icon: <User className="mr-2 h-4 w-4" />,
      active: pathname === "/profile",
    },
  ]

  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Rechercher..." className="w-full pl-8 bg-muted/40" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 px-2">
          {routes.map((route) => (
            <Button
              key={route.href}
              asChild
              variant={route.active ? "secondary" : "ghost"}
              className="justify-start"
              size="sm"
            >
              <Link href={route.href}>
                {route.icon}
                {route.label}
              </Link>
            </Button>
          ))}

          {user && (
            <>
              <div className="mt-4 mb-2 px-4">
                <p className="text-xs font-medium text-muted-foreground">Mon espace</p>
              </div>
              {authRoutes.map((route) => (
                <Button
                  key={route.href}
                  asChild
                  variant={route.active ? "secondary" : "ghost"}
                  className="justify-start"
                  size="sm"
                >
                  <Link href={route.href}>
                    {route.icon}
                    {route.label}
                  </Link>
                </Button>
              ))}
            </>
          )}

          {!user && (
            <Button asChild variant="default" className="mt-4 justify-start" size="sm">
              <Link href="/sign-in">
                <User className="mr-2 h-4 w-4" />
                Se connecter
              </Link>
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
