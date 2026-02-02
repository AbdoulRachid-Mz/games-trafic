"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, ShoppingCart, Users, Trophy, MessageSquare } from "lucide-react"
import { Notification } from "@/database/schema"


interface NotificationListProps {
  initialNotifications: Notification[]
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  // Filter notifications based on active tab
  const filteredNotifications =
    activeTab === "all" ? notifications : notifications.filter((n) => n.type.includes(activeTab.toUpperCase()))

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (notification.linkUrl) {
      router.push(notification.linkUrl)
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "FOLLOW":
        return <Users className="h-5 w-5 text-blue-500" />
      case "PURCHASE":
      case "SALE":
        return <ShoppingCart className="h-5 w-5 text-green-500" />
      case "TOURNAMENT":
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case "MESSAGE":
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vos notifications</CardTitle>
        <CardDescription>Restez informé des dernières activités</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="purchase">Achats</TabsTrigger>
            <TabsTrigger value="follow">Abonnements</TabsTrigger>
            <TabsTrigger value="tournament">Tournois</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-lg border ${notification.linkUrl ? "cursor-pointer hover:bg-muted/50" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground">
                          {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune notification</h3>
                <p className="text-muted-foreground">Vous n'avez pas encore de notifications dans cette catégorie.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
