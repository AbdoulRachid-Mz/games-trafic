// components/comments/comment-list.tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentItem } from "./comment-item";
import { deleteMessage, markMessageAsRead } from "@/actions/messages";
import { toast } from "sonner";
import type { Message, EntityType } from "@/database/schema";

interface CommentListProps {
  comments: Message[];
  entityId: string;
  entityType: EntityType;
  onCommentAdded?: () => void;
}

export function CommentList({ 
  comments, 
  entityId, 
  entityType,
  onCommentAdded 
}: CommentListProps) {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Mutation pour supprimer un commentaire
  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
      toast.success("Commentaire supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error("Failed to delete comment:", error);
    },
  });

  // Mutation pour marquer comme lu
  const readMutation = useMutation({
    mutationFn: markMessageAsRead,
    onError: (error) => {
      console.error("Failed to mark as read:", error);
    },
  });

  const handleDelete = async (commentId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      deleteMutation.mutate(commentId);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId === replyingTo ? null : commentId);
  };

  const handleMarkAsRead = (commentId: string) => {
    readMutation.mutate(commentId);
  };

  // Grouper les commentaires par parent
  const rootComments = comments.filter(comment => !comment.parentMessageId);
  const repliesByParent = comments.reduce((acc, comment) => {
    if (comment.parentMessageId) {
      if (!acc[comment.parentMessageId]) {
        acc[comment.parentMessageId] = [];
      }
      acc[comment.parentMessageId].push(comment);
    }
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <div className="space-y-4">
      {rootComments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            entityId={entityId}
            entityType={entityType}
            onDelete={() => handleDelete(comment.id)}
            onReply={() => handleReply(comment.id)}
            onMarkAsRead={() => handleMarkAsRead(comment.id)}
            isReplying={replyingTo === comment.id}
            replies={repliesByParent[comment.id] || []}
            onCommentAdded={onCommentAdded}
          />
          
          {/* Réponses */}
          {repliesByParent[comment.id] && repliesByParent[comment.id].length > 0 && (
            <div className="ml-8 mt-2 space-y-2 border-l-2 pl-4 border-border/50">
              {repliesByParent[comment.id].map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  entityId={entityId}
                  entityType={entityType}
                  onDelete={() => handleDelete(reply.id)}
                  onReply={() => handleReply(reply.id)}
                  onMarkAsRead={() => handleMarkAsRead(reply.id)}
                  isReplying={replyingTo === reply.id}
                  depth={1}
                  onCommentAdded={onCommentAdded}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}