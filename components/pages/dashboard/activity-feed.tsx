"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Store,
  Trophy,
  ShoppingBag,
  CreditCard,
  User,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Activity {
  id: string;
  type: string;
  title?: string;
  action?: string;
  description: string;
  timestamp: Date | string;
  icon?: any;
  status?: "success" | "pending" | "failed";
}

interface ActivityFeedProps {
  activities?: Activity[];
}

const activityIcons: Record<string, any> = {
  shop: Store,
  tournament: Trophy,
  purchase: ShoppingBag,
  transaction: CreditCard,
  "sign-in": User,
  "sign-out": User,
  "register": User,
};

const statusColors = {
  success: "bg-green-500",
  pending: "bg-yellow-500",
  failed: "bg-red-500",
};

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  const displayActivities = activities;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity, index) => {
            const Icon = activityIcons[activity.type] || Store;
            const statusColor = activity.status
              ? statusColors[activity.status]
              : "bg-gray-500";

            const timestamp = activity.timestamp instanceof Date 
                ? activity.timestamp 
                : new Date(activity.timestamp);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Icon */}
                <div className="relative">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {activity.status && (
                    <div
                      className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${statusColor} border-2 border-background`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="mb-1"
                  >
                    {activity.title || activity.action || "Activité"}
                  </Typography>
                  <Typography
                    variant="caption2"
                    theme="muted"
                    className="line-clamp-2"
                  >
                    {activity.description}
                  </Typography>
                  <Typography variant="caption2" theme="muted" className="mt-1">
                    {formatDate(timestamp)}
                  </Typography>
                </div>
              </motion.div>
            );
          })}

          {displayActivities.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <Typography variant="body-lg" theme="muted">
                Aucune activité récente
              </Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
