// app/chats/groups/[groupId]/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupInfo, GroupInfoData } from "@/components/pages/chats/group-info";
import { GroupMembers } from "@/components/pages/chats/group-members";
import type {
  // GroupInfoData,
  GroupMember,
} from "@/components/pages/chats/group-members";
import { useAuthContext } from "@/contexts/auth-context";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { useGroupById, useGroupMembers } from "@/hooks/use-groupes";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAddGroupMember, useRequestJoinGroup } from "@/hooks/use-groupes";
import { useInfiniteNotifications, useDeleteNotification } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

function GroupDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const groupId = params.groupId as string;

  const [activeTab, setActiveTab] = useState("info");

  // Fetch group data
  const { data: group, isLoading: groupLoading } = useGroupById(groupId);
  const { data: membersData, isLoading: membersLoading } =
    useGroupMembers(groupId);
  const requestJoinMutation = useRequestJoinGroup();
  const addMemberMutation = useAddGroupMember();
  const deleteNotificationMutation = useDeleteNotification();

  const members = membersData?.data || [];
  const currentMember = members.find((m: any) => m.userId === user?.id);
  const currentUserRole = currentMember?.role || "MEMBER";
  const isOwner = group?.creatorId === user?.id || currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  // Fetch join requests (notifications) if owner/admin
  const { 
    data: requestsData, 
    isLoading: requestsLoading,
    refetch: refetchRequests
  } = useInfiniteNotifications(
    user?.id || "",
    { type: ["GROUP_JOIN_REQUEST"] },
    { enabled: !!user?.id && isOwner }
  );

  const joinRequests = requestsData?.pages.flatMap(page => 
    page.notifications.filter((n: any) => n.linkUrl?.includes(`/chats/groups/${groupId}`))
  ) || [];

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/chats/groups/${groupId}/edit`);
  };

  const handleLeave = () => {
    toast.info("Leave group feature coming soon");
  };

  const handleViewMembers = () => {
    setActiveTab("members");
  };

  const handleStartChat = () => {
    router.push(`/chats/group:${groupId}`);
  };

  const handleRequestAccess = async () => {
    if (!user) {
      toast.error("You must be logged in to request access");
      return;
    }

    try {
      await requestJoinMutation.mutateAsync({
        groupId,
        userId: user.id,
      });
      toast.success("Join request sent to group admins.");
    } catch (error) {
      console.error("Failed to send join request:", error);
      toast.error("Failed to send join request");
    }
  };

  const handleAcceptRequest = async (notificationId: string, requesterId: string) => {
    if (!user?.id) return;

    try {
      // 1. Add user to group
      await addMemberMutation.mutateAsync({
        groupId,
        userId: requesterId,
        role: "MEMBER",
      });

      // 2. Delete the notification
      await deleteNotificationMutation.mutateAsync({
        notificationId,
        userId: user.id,
      });

      toast.success("User added to the group!");
      refetchRequests();
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast.error("Failed to accept request");
    }
  };

  const handlePromoteToAdmin = (memberId: string) => {
    toast.info("Promote member feature coming soon");
  };

  const handleDemoteToMember = (memberId: string) => {
    toast.info("Demote member feature coming soon");
  };

  const handleRemoveMember = (memberId: string) => {
    toast.info("Remove member feature coming soon");
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-[var(--chat-background)]">
        <div className="sticky top-0 z-10 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[var(--chat-background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--chat-text)]">
            Group Not Found
          </h1>
          <p className="text-[var(--chat-textMuted)]">
            This group doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/chats")}>Back to Chats</Button>
        </div>
      </div>
    );
  }

  // Access control for private groups
  const isMember = !!currentMember;
  const isPrivate = group.isPrivate;
  const showRequestAccess = isPrivate && !isMember;

  if (showRequestAccess) {
    return (
      <div className="min-h-screen bg-[var(--chat-background)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-[var(--chat-surface)] border-[var(--chat-border)]">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--chat-primary)]/10 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-[var(--chat-primary)]" />
            </div>
            <CardTitle className="text-xl font-bold text-[var(--chat-text)]">
              Private Group
            </CardTitle>
            <CardDescription className="text-[var(--chat-textMuted)]">
              This group is private. You need to be a member to view its content
              and participate in discussions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              className="w-full bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)]"
              onClick={handleRequestAccess}
              disabled={requestJoinMutation.isPending}
            >
              {requestJoinMutation.isPending ? "Sending..." : "Request Access"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-[var(--chat-text)]"
              onClick={() => router.push("/chats")}
            >
              Back to Chats
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupInfo: GroupInfoData = {
    id: group.id,
    name: group.name,
    description: group.description || undefined,
    image: group.image || undefined,
    isPrivate: group.isPrivate || false,
    createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
    memberCount: members.length,
    creatorId: group.creatorId,
  };

  return (
    <div className="min-h-screen bg-[var(--chat-background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-[var(--chat-text)]">
                {group.name}
              </h1>
              <p className="text-sm text-[var(--chat-textMuted)]">
                {members.length} {members.length > 1 ? "members" : "member"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleStartChat}
            className="bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] text-[var(--chat-messageSentText)]"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Open Chat
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn(
            "w-full bg-[var(--chat-surface)] border border-[var(--chat-border)]",
            isOwner ? "grid grid-cols-3" : "grid grid-cols-2"
          )}>
            <TabsTrigger value="info">
              Group Info
            </TabsTrigger>
            <TabsTrigger value="members">
              Members ({members.length})
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="requests" className="relative">
                Requests
                {joinRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--chat-error)] text-[10px] text-white">
                    {joinRequests.length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <GroupInfo
              group={groupInfo}
              currentUserId={user?.id || ""}
              currentUserRole={currentUserRole}
              onEdit={handleEdit}
              onLeave={handleLeave}
              onViewMembers={handleViewMembers}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] p-4">
              <h3 className="font-semibold text-[var(--chat-text)] mb-4">
                Group Members
              </h3>
              <GroupMembers
                members={members.map((m: any) => ({
                  id: m.id,
                  userId: m.userId,
                  username: m.user?.username || m.user?.fullName || "Unknown",
                  avatar: m.user?.profileImage,
                  role: m.role || "MEMBER",
                  joinedAt: m.joinedAt || new Date(),
                  updatedAt: m.updatedAt || new Date(),
                }))}
                currentUserId={user?.id || ""}
                currentUserRole={currentUserRole}
                onPromoteToAdmin={handlePromoteToAdmin}
                onDemoteToMember={handleDemoteToMember}
                onRemoveMember={handleRemoveMember}
                className="max-h-[600px]"
              />
            </div>
          </TabsContent>

          {isOwner && (
            <TabsContent value="requests" className="mt-6">
              <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] p-4">
                <h3 className="font-semibold text-[var(--chat-text)] mb-4">
                  Pending Join Requests
                </h3>
                {requestsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : joinRequests.length === 0 ? (
                  <div className="text-center py-8 text-[var(--chat-textMuted)]">
                    No pending join requests.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {joinRequests.map((req: any) => {
                      const requesterId = req.linkUrl?.split("requestUser=")[1];
                      return (
                        <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--chat-surfaceHover)] border border-[var(--chat-border)]">
                          <div>
                            <p className="font-medium text-[var(--chat-text)]">{req.title}</p>
                            <p className="text-sm text-[var(--chat-textMuted)]">{req.message}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)]"
                              onClick={() => handleAcceptRequest(req.id, requesterId)}
                              disabled={addMemberMutation.isPending}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[var(--chat-error)]"
                              onClick={() => deleteNotificationMutation.mutate({ notificationId: req.id, userId: user?.id || "" })}
                            >
                              Ignore
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default function GroupDetailPage() {
  return (
    <ChatThemeProvider>
      <GroupDetailContent />
    </ChatThemeProvider>
  );
}
