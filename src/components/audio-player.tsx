"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { wavesurfer, isReady } = useWavesurfer({
    container: containerRef,
    url: audioUrl,
    waveColor: "hsl(215 16% 47% / 0.5)",
    progressColor: "hsl(221.2 83.2% 53.3%)",
    cursorColor: "hsl(221.2 83.2% 53.3%)",
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    height: 60,
  });

  useEffect(() => {
    if (!wavesurfer) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = (time: number) => setCurrentTime(time);
    const onReady = (duration: number) => setDuration(duration);

    wavesurfer.on("play", onPlay);
    wavesurfer.on("pause", onPause);
    wavesurfer.on("timeupdate", onTimeUpdate);
    wavesurfer.on("ready", onReady);

    return () => {
      wavesurfer.un("play", onPlay);
      wavesurfer.un("pause", onPause);
      wavesurfer.un("timeupdate", onTimeUpdate);
      wavesurfer.un("ready", onReady);
    };
  }, [wavesurfer]);

  const togglePlay = useCallback(() => {
    wavesurfer?.playPause();
  }, [wavesurfer]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "generation.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4 w-full p-4 border rounded-xl bg-card">
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full flex-shrink-0"
          onClick={togglePlay}
          disabled={!isReady}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </Button>
        <div className="flex-1 min-w-0" ref={containerRef} />
        <Button
          variant="outline"
          size="icon"
          onClick={handleDownload}
          disabled={!isReady}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-16">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
