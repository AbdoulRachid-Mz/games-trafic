"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface EnhancedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  defaultImage?: string;
  title?: string;
  description?: string;
  enablePreview?: boolean;
  className?: string;
  imgClassName?: string;
  fill?: boolean;
}

export function EnhancedImage({
  src,
  alt,
  width,
  height,
  defaultImage = "/fallback.jpg",
  enablePreview = true,
  title,
  description,
  className,
  imgClassName,
  fill = false,
  ...props
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const imageSrc = hasError || !src ? defaultImage : src;

  return (
    <>
      <div
        className={cn("relative overflow-hidden rounded-md", className, {
          "cursor-zoom-in": enablePreview,
        })}
        onClick={() => enablePreview && setDialogOpen(true)}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
          </div>
        )}

        <Image
          {...props}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300 object-cover",
            imgClassName,
            isLoading ? "opacity-0" : "opacity-100"
          )}
        />
      </div>

      {enablePreview && (
        <ImageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          src={imageSrc}
          alt={alt}
          title={title}
          description={description}
        />
      )}
    </>
  );
}

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

function ImageDialog({ open, onOpenChange, src, alt, title, description }: ImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-4">
        {title && <DialogTitle>{title}</DialogTitle>}
        {description && <DialogDescription>{description}</DialogDescription>}
        <div className="mt-4 relative w-full h-[60vh]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain rounded-md"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}