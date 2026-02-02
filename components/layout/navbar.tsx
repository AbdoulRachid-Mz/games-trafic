"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Search, Moon, Sun, Bell, MessageSquare, Menu, Home, ShoppingCart, Trophy, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "./logo"
import { MobileNav } from "./mobile-nav"
import { useState, useEffect } from "react"
// import { GlobalSearch } from "../search/global-search"
import { useAuthContext } from "@/contexts/auth-context"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuthContext()
  const [isMounted, setIsMounted] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileNav />
            </SheetContent>
          </Sheet>

          <Logo />

          <div className="hidden md:flex md:w-full max-w-sm items-center space-x-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="w-full pl-8 bg-muted/40"
                onClick={() => setIsSearchOpen(true)}
                readOnly
              />
              {/* <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} /> */}
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              <span className="sr-only">Accueil</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/marketplace">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Marketplace</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tournaments">
              <Trophy className="h-5 w-5" />
              <span className="sr-only">Tournois</span>
            </Link>
          </Button>

          {user && (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/messages">
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Link>
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer de thème</span>
          </Button>

          {user ? (
            <Button>
              after sign-in
            </Button>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/sign-in">
                <User className="h-5 w-5" />
                <span className="sr-only">Se connecter</span>
              </Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Rechercher</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer de thème</span>
          </Button>

          {user ? (
            <Button>
              afterSignOutUrl
            </Button>
            // <UserButton
            //   afterSignOutUrl="/"
            //   appearance={{
            //     elements: {
            //       userButtonAvatarBox: "h-8 w-8",
            //     },
            //   }}
            // />
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/sign-in">
                <User className="h-5 w-5" />
                <span className="sr-only">Se connecter</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
