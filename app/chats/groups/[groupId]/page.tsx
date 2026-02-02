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
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

  const members = membersData?.data || [];
  const currentMember = members.find((m) => m.userId === user?.id);
  const currentUserRole = currentMember?.role || "MEMBER";

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
                {members.length} members
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
          <TabsList className="w-full bg-[var(--chat-surface)] border border-[var(--chat-border)]">
            <TabsTrigger value="info" className="flex-1">
              Group Info
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-1">
              Members ({members.length})
            </TabsTrigger>
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
                members={members.map(m => ({
                  id: m.id,
                  userId: m.userId,
                  username: "", // TODO: fetch/display actual username
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
