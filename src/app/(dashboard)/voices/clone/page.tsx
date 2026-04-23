"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, Loader2 } from "lucide-react";
import { MicRecorder } from "@/components/mic-recorder";

export default function CloneVoicePage() {
  const router = useRouter();
  const trpc = useTRPC();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audioBase64, setAudioBase64] = useState("");
  const [audioMimeType, setAudioMimeType] = useState<any>("");
  const [fileName, setFileName] = useState("");

  const cloneMutation = useMutation(trpc.voice.clone.mutationOptions({
    onSuccess: () => {
      router.push("/voices");
      router.refresh();
    }
  }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setAudioMimeType(file.type as any);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setAudioBase64(reader.result as string);
    };
  };

  const handleRecorded = (base64: string, mimeType: string) => {
    setAudioBase64(base64);
    setAudioMimeType(mimeType as any);
    setFileName("recorded-audio.webm");
  };

  const handleClone = () => {
    if (!name || !audioBase64 || !audioMimeType) return;
    
    cloneMutation.mutate({
      name,
      description,
      audioBase64,
      audioMimeType,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clone a Voice</h1>
        <p className="text-muted-foreground mt-2">
          Create a custom AI voice from a clean audio sample.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice Details</CardTitle>
          <CardDescription>Give your new voice a name and description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input 
              id="name" 
              placeholder="e.g., John's Professional Voice" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input 
              id="description" 
              placeholder="e.g., Deep, resonant, perfect for narration" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reference Audio</CardTitle>
          <CardDescription>
            Provide a clean 10-60 second audio sample of the voice with no background noise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Upload Audio File</Label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-4" />
              <div className="text-center">
                <Button variant="secondary" onClick={() => document.getElementById('audio-upload')?.click()}>
                  Browse Files
                </Button>
                <input 
                  id="audio-upload" 
                  type="file" 
                  accept="audio/wav, audio/mpeg, audio/ogg, audio/webm, audio/mp4" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supports .wav, .mp3, .ogg, .webm
                </p>
              </div>
              {fileName && !fileName.includes("recorded") && (
                <p className="text-sm font-medium mt-4 text-primary">
                  Selected: {fileName}
                </p>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or record directly</span>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Record Microphone</Label>
            <MicRecorder onRecorded={handleRecorded} />
            {fileName && fileName.includes("recorded") && (
              <p className="text-sm font-medium text-center text-primary">
                Using recorded audio sample
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {cloneMutation.isError && (
            <div className="w-full p-4 rounded-md bg-destructive/10 text-destructive text-sm">
              Failed to clone voice: {cloneMutation.error.message}
            </div>
          )}
          
          <Button 
            className="w-full" 
            size="lg"
            disabled={!name || !audioBase64 || cloneMutation.isPending}
            onClick={handleClone}
          >
            {cloneMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cloning Voice...
              </>
            ) : (
              "Clone Voice"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
