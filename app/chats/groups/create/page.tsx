// app/chats/groups/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthContext } from "@/contexts/auth-context";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { useCreateGroup } from "@/hooks/use-groupes";
import { canCreateGroup, getGroupLimits } from "@/lib/chat-utils";
import { getInitials } from "@/utils/chat-helpers";
import { toast } from "sonner";
import { ArrowLeft, Upload, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedUser {
  id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

function CreateGroupContent() {
  const router = useRouter();
  const { user } = useAuthContext();
  const createGroupMutation = useCreateGroup();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(
    null
  );
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const limits = getGroupLimits(user);

  // Check if user can create groups
  const validation = canCreateGroup(user, 0); // TODO: Get actual group count
  if (!validation.valid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[var(--chat-background)]">
        <div className="text-center space-y-4">
          <Users className="h-16 w-16 mx-auto text-[var(--chat-textMuted)]" />
          <h1 className="text-2xl font-bold text-[var(--chat-text)]">
            Cannot Create Group
          </h1>
          <p className="text-[var(--chat-textMuted)]">{validation.error}</p>
          <Button onClick={() => router.push("/chats")}>Back to Chats</Button>
        </div>
      </div>
    );
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setGroupImage(null);
    setGroupImagePreview(null);
  };

  const handleToggleUser = (user: SelectedUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      // TODO: Upload group image if provided
      let imageUrl: string | undefined;
      if (groupImage) {
        // Implement image upload
        // imageUrl = await uploadImage(groupImage);
      }

      await createGroupMutation.mutateAsync({
        name: groupName,
        description: description || undefined,
        image: imageUrl,
        isPrivate,
        creatorId: user.id,
      });

      toast.success("Group created successfully");
      router.push("/chats");
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    }
  };

  // Mock users for selection (replace with actual user search)
  const mockUsers: SelectedUser[] = [
    { id: "1", username: "user1", fullName: "John Doe" },
    { id: "2", username: "user2", fullName: "Jane Smith" },
    { id: "3", username: "user3", fullName: "Bob Johnson" },
  ];

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--chat-background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[var(--chat-text)]">
              Create New Group
            </h1>
            <p className="text-sm text-[var(--chat-textMuted)]">
              {limits.maxGroups === Infinity
                ? "Unlimited groups"
                : `You can create up to ${limits.maxGroups} group(s)`}
            </p>
          </div>
          <Button
            onClick={handleCreateGroup}
            disabled={
              !groupName.trim() ||
              selectedUsers.length === 0 ||
              createGroupMutation.isPending
            }
            className="bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] text-[var(--chat-messageSentText)]"
          >
            {createGroupMutation.isPending ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Group Info */}
        <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] p-6 space-y-6">
          <h2 className="text-lg font-semibold text-[var(--chat-text)]">
            Group Information
          </h2>

          {/* Group Image */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={groupImagePreview || undefined} />
                <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)]">
                  <Users className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              {groupImagePreview && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-[var(--chat-error)] text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <Label htmlFor="group-image" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--chat-surface)] border border-[var(--chat-border)] rounded-lg hover:bg-[var(--chat-surfaceHover)] transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload Image</span>
                </div>
              </Label>
              <input
                id="group-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={50}
              className="bg-[var(--chat-background)] border-[var(--chat-border)]"
            />
            <p className="text-xs text-[var(--chat-textMuted)]">
              {groupName.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              maxLength={200}
              rows={3}
              className="bg-[var(--chat-background)] border-[var(--chat-border)]"
            />
            <p className="text-xs text-[var(--chat-textMuted)]">
              {description.length}/200 characters
            </p>
          </div>

          {/* Private Group */}
          {limits.canCreatePrivateGroups && (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Private Group</Label>
                <p className="text-sm text-[var(--chat-textMuted)]">
                  Only invited members can join
                </p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          )}
        </div>

        {/* Add Members */}
        <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--chat-text)]">
              Add Members
            </h2>
            <span className="text-sm text-[var(--chat-textMuted)]">
              {selectedUsers.length} selected (max {limits.maxMembersPerGroup})
            </span>
          </div>

          {/* Search */}
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="bg-[var(--chat-background)] border-[var(--chat-border)]"
          />

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-3 py-1 bg-[var(--chat-primary)]/10 border border-[var(--chat-primary)] rounded-full"
                >
                  <span className="text-sm text-[var(--chat-text)]">
                    {user.fullName || user.username}
                  </span>
                  <button
                    onClick={() => handleToggleUser(user)}
                    className="text-[var(--chat-textMuted)] hover:text-[var(--chat-error)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* User List */}
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                const canSelect =
                  selectedUsers.length < limits.maxMembersPerGroup ||
                  isSelected;

                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      canSelect && "hover:bg-[var(--chat-surfaceHover)]",
                      !canSelect && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => canSelect && handleToggleUser(user)}
                  >
                    <Checkbox checked={isSelected} disabled={!canSelect} />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)]">
                        {getInitials(user.fullName || user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--chat-text)]">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-sm text-[var(--chat-textMuted)]">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default function CreateGroupPage() {
  return (
    <ChatThemeProvider>
      <CreateGroupContent />
    </ChatThemeProvider>
  );
}
