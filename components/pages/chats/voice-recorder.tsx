"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, Send, Mic, Pause, Play, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onSend: (audioFile: File) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Démarrer l'enregistrement à l'ouverture
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          setAudioFile(file);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Erreur d'accès au micro:", err);
        onCancel();
      }
    };

    startRecording();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
  };

  const handleSend = () => {
    if (audioFile) {
      onSend(audioFile);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-[var(--chat-background)] px-4 py-2 rounded-2xl w-full animate-in slide-in-from-bottom-2 duration-200 shadow-inner border border-[var(--chat-border)]">
      <Button
        variant="ghost"
        size="icon"
        onClick={onCancel}
        className="text-red-500 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-5 w-5" />
      </Button>

      <div className="flex-1 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-mono font-medium text-[var(--chat-text)] w-10 text-center">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Wave animation placeholder */}
        <div className="flex-1 h-8 flex items-center gap-0.5 px-2">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: isRecording ? [4, Math.random() * 24 + 4, 4] : 4,
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.05,
              }}
              className="w-1 bg-[var(--chat-primary)] rounded-full opacity-60"
            />
          ))}
        </div>
      </div>

      {isRecording ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          className="text-[var(--chat-primary)]"
        >
          <StopCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Button
          onClick={handleSend}
          disabled={!audioFile}
          className="bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] rounded-full h-10 w-10 p-0"
        >
          <Send className="h-5 w-5 ml-0.5 text-white" />
        </Button>
      )}
    </div>
  );
}
