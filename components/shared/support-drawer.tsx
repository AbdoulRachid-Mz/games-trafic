"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Typography } from "@/components/ui/typography"
import { 
  Mail, 
  Phone, 
  MessageCircle,
  ExternalLink,
  Copy,
  Check
} from "lucide-react"
import { toast } from "sonner"

interface SupportContact {
  type: "email" | "phone" | "whatsapp"
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  action?: "copy" | "link"
  href?: string
}

const supportContacts: SupportContact[] = [
  {
    type: "email",
    label: "Email Support",
    value: "support@gtc.com",
    icon: Mail,
    action: "copy"
  },
  {
    type: "phone",
    label: "Téléphone",
    value: "+237 6XX XXX XXX",
    icon: Phone,
    action: "copy"
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    value: "+237 6XX XXX XXX",
    icon: MessageCircle,
    action: "link",
    href: "https://wa.me/237XXXXXXXXX"
  }
]

interface SupportDrawerProps {
  children: React.ReactNode
}

export function SupportDrawer({ children }: SupportDrawerProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      toast.success("Copié dans le presse-papiers")
      
      setTimeout(() => setCopiedValue(null), 2000)
    } catch (err) {
      toast.error("Erreur lors de la copie")
    }
  }

  const handleAction = (contact: SupportContact) => {
    if (contact.action === "copy") {
      handleCopy(contact.value)
    } else if (contact.action === "link" && contact.href) {
      window.open(contact.href, "_blank")
    }
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Contacter le support</DrawerTitle>
          <DrawerDescription>
            Choisissez votre moyen de contact préféré pour obtenir de l'aide
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 pb-6">
          <div className="space-y-3">
            {supportContacts.map((contact) => {
              const Icon = contact.icon
              const isCopied = copiedValue === contact.value
              
              return (
                <div
                  key={contact.type}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Typography variant="body-sm" weight="medium">
                        {contact.label}
                      </Typography>
                      <Typography variant="caption1" theme="muted">
                        {contact.value}
                      </Typography>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(contact)}
                    className="flex items-center gap-2"
                  >
                    {contact.action === "copy" ? (
                      isCopied ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copier
                        </>
                      )
                    ) : (
                      <>
                        <ExternalLink className="h-3 w-3" />
                        Ouvrir
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <Typography variant="body-sm" weight="medium" className="mb-2">
              💡 Conseil
            </Typography>
            <Typography variant="caption1" theme="muted">
              Pour un support plus rapide, incluez votre ID utilisateur et une description détaillée de votre problème.
            </Typography>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}