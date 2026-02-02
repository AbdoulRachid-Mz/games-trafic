"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RichTextContentProps {
  content: string;
  className?: string;
  maxLength?: number;
  showReadMore?: boolean;
}

export function RichTextContent({ 
  content, 
  className,
  maxLength,
  showReadMore = false 
}: RichTextContentProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // Extraire le texte brut du HTML pour la limite de caractères
  const extractText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const plainText = extractText(content);
  const shouldTruncate = maxLength && plainText.length > maxLength;
  const displayContent = shouldTruncate && !isExpanded 
    ? content.slice(0, maxLength * 3) + '...' // Approx 3x pour HTML
    : content;

  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <div 
        dangerouslySetInnerHTML={{ __html: displayContent }}
        className="break-words"
      />
      
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          {isExpanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}