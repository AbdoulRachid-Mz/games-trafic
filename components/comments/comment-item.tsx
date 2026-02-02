"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  Reply,
  Check,
  ExternalLink,
} from "lucide-react";
import { CommentForm } from "./comment-form";
import { useAuthContext } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RichTextContent } from "../ui/rich-text-content";

interface CommentItemProps {
  comment: any;
  entityId: string;
  entityType: string;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
  onReply?: () => void;
  onShare?: (id: string) => void;
  isReplying?: boolean;
  replies?: any[];
  depth?: number;
  onCommentAdded?: () => void;
}

export function CommentItem({
  comment,
  entityId,
  entityType,
  onDelete,
  onLike,
  onReply,
  onShare,
  isReplying = false,
  replies = [],
  depth = 0,
  onCommentAdded,
}: CommentItemProps) {
  const { user } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0);

  const isOwner = user?.id === comment.author?.id;
  const isAdmin = user?.isAdmin;
  const canModify = isOwner || isAdmin;

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount((prev: number) => newLikedState ? prev + 1 : prev - 1);
    onLike?.(comment.id);
  };

  const handleReply = () => {
    onReply?.();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/comment/${comment.id}`);
    toast.success("Lien copié dans le presse-papier !");
    onShare?.(comment.id);
  };

  return (
    <div className={cn(
      "group relative",
      depth > 0 && "ml-12 border-l-2 border-border/30 pl-4"
    )}>
      {/* Thread line for nested comments */}
      {depth > 0 && (
        <div className="absolute left-[-2px] top-0 bottom-0 w-0.5 bg-border/20" />
      )}
      
      <div className="flex gap-3 p-3 rounded-2xl hover:bg-secondary/20 transition-colors duration-200">
        {/* Avatar with verified badge */}
        <div className="flex-shrink-0 relative">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            <AvatarImage src={comment.author?.profileImage} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {comment.author?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {comment.author?.isVerified && (
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {comment.author?.fullName || comment.author?.username}
                </span>
                
                {comment.author?.isAdmin && (
                  <Badge variant="secondary" className="text-xs">Admin</Badge>
                )}
                
                {comment.author?.isVip && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs">
                    VIP
                  </Badge>
                )}
              </div>
              
              <span className="text-xs text-muted-foreground">
                @{comment.author?.username}
              </span>
              
              <span className="text-xs text-muted-foreground">·</span>
              
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </DropdownMenuItem>
                
                {canModify && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(comment.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuItem onClick={handleReply}>
                  <Reply className="h-4 w-4 mr-2" />
                  Répondre
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Signaler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          {isEditing ? (
            <CommentForm
              entityId={entityId}
              entityType={entityType}
              parentId={comment.parentId}
              initialContent={comment.content}
              commentId={comment.id}
              onCancel={() => setIsEditing(false)}
              onCommentAdded={() => {
                setIsEditing(false);
                onCommentAdded?.();
              }}
              className="mt-2"
              showActions={false}
            />
          ) : (
            <div className="mt-1">
              <RichTextContent 
                content={comment.content} 
                className="text-sm text-foreground/90 leading-relaxed"
              />
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 rounded-full px-3",
                  isLiked && "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                )}
                onClick={handleLike}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3"
                onClick={handleReply}
              >
                <MessageCircle className="h-4 w-4" />
                {replies.length > 0 && <span>{replies.length}</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Reply Form */}
          {isReplying && !isEditing && (
            <div className="mt-4">
              <CommentForm
                entityId={entityId}
                entityType={entityType}
                parentId={comment.id}
                autoFocus
                onCommentAdded={() => {
                  onReply?.();
                  onCommentAdded?.();
                  setShowReplies(true);
                }}
                placeholder="Écrivez votre réponse..."
                showActions={false}
              />
            </div>
          )}

          {/* View Replies */}
          {replies.length > 0 && !isReplying && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? "Masquer" : "Afficher"} {replies.length} réponse
                {replies.length > 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              entityId={entityId}
              entityType={entityType}
              depth={depth + 1}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}