"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, RotateCcw } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";

export function MicRecorder({
  onRecorded,
}: {
  onRecorded: (base64: string, mimeType: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onRecorded(base64data, blob.type);
        };
        
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimeLeft(10);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access the microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setTimeLeft(10);
    chunksRef.current = [];
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (audioUrl) {
    return (
      <div className="space-y-4">
        <AudioPlayer audioUrl={audioUrl} />
        <Button variant="outline" onClick={resetRecording} className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Record Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/20">
      <div className="text-4xl font-mono mb-4">
        00:{timeLeft.toString().padStart(2, "0")}
      </div>
      
      {isRecording ? (
        <Button 
          variant="destructive" 
          size="lg" 
          className="rounded-full h-16 px-8 animate-pulse"
          onClick={stopRecording}
        >
          <Square className="mr-2 h-6 w-6 fill-current" />
          Stop Recording
        </Button>
      ) : (
        <Button 
          variant="default" 
          size="lg" 
          className="rounded-full h-16 px-8"
          onClick={startRecording}
        >
          <Mic className="mr-2 h-6 w-6" />
          Start Recording (10s limit)
        </Button>
      )}
    </div>
  );
}
