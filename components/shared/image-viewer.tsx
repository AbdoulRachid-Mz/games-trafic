"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ListRestart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  trigger?: React.ReactNode;
  className?: string;
}

export function ImageViewer({
  images,
  initialIndex = 0,
  trigger,
  className,
}: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setRotation(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset zoom and rotation when closing
    setTimeout(() => {
      setScale(1);
      setRotation(0);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <div className={cn("cursor-pointer", className)}>
            <Image
              src={images[initialIndex] || "/placeholder.svg"}
              alt="Preview"
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-screen-lg p-0 border-none bg-transparent">
        <DialogTitle className="hidden"></DialogTitle>
        <div className="relative flex items-center justify-center w-full h-full min-h-[50vh]">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative z-10 flex flex-col items-center max-w-full max-h-full">
            <div className="overflow-hidden rounded-lg">
              <Image
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`Image ${currentIndex + 1}`}
                width={500}
                height={500}
                className="max-h-[80vh] object-contain transition-transform"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                }}
              />
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handlePrevious}
                disabled={images.length <= 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handleReset}
              >
                {/* <ZoomOut className="h-5 w-5" /> */}
                <ListRestart className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handleRotate}
              >
                <RotateCw className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handleNext}
                disabled={images.length <= 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-2 z-20">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
