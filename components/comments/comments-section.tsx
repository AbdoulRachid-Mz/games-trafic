// components/comments/comments-section.tsx
"use client";

import React, { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { Typography } from "@/components/ui/typography";
import { MessageCircle, Loader2 } from "lucide-react";
import { EntityType } from "@/database/schema";
import { getMessages } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CommentsSectionProps {
  entityId: string;
  entityType: EntityType;
  title?: string;
  className?: string;
  
}

export function CommentsSection({
  entityId,
  entityType,
  title = "Commentaires",
  className,
}: CommentsSectionProps) {
  const queryClient = useQueryClient();

  // Query infinie pour les commentaires
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["comments", entityType, entityId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getMessages({
        filters: {
          entityId,
          entityType,
          isOpenToPublic: true,
        },
        options: {
          sortBy: "createdAt",
          sortOrder: "desc",
          populate: ["sender", "replies.sender"],
        },
        pagination: {
          limit: 20,
          page: pageParam,
        },
      });
      return {
        comments: res.data,
        nextPage: res.pagination.hasNext ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const handleCommentAdded = () => {
    queryClient.invalidateQueries({
      queryKey: ["comments", entityType, entityId],
    });
    refetch();
  };

  const allComments = data?.pages.flatMap((page) => page.comments) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <Typography variant="h3" className="text-lg font-bold">
            {title}
            {allComments.length > 0 && (
              <span className="ml-2 text-muted-foreground font-normal">
                ({allComments.length})
              </span>
            )}
          </Typography>
        </div>
      </div>

      {/* Formulaire de commentaire */}
      <div className="bg-secondary/20 rounded-xl p-4 border border-border/50">
        <CommentForm
          entityId={entityId}
          entityType={entityType}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Liste des commentaires */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allComments.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-primary/50" />
            </div>
            <Typography variant="body-lg" theme="muted" className="mb-2">
              Soyez le premier à commenter !
            </Typography>
            <Typography variant="body-sm" theme="muted">
              Partagez votre expérience ou posez une question.
            </Typography>
          </div>
        ) : (
          <>
            <CommentList
              comments={allComments}
              entityId={entityId}
              entityType={entityType}
              onCommentAdded={handleCommentAdded}
            />

            {hasNextPage && (
              <div className="text-center pt-6">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="gap-2"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Charger plus de commentaires"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
