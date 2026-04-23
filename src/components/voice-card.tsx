"use client";

import { Voice } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Mic2, Globe, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

interface VoiceCardProps {
  voice: Voice;
  onSelect?: (voiceId: string) => void;
}

export function VoiceCard({ voice, onSelect }: VoiceCardProps) {
  const router = useRouter();

  const handleSelect = () => {
    if (onSelect) {
      onSelect(voice.id);
    } else {
      router.push(`/generate?voiceId=${voice.id}`);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{voice.name}</CardTitle>
          <Badge variant={voice.isSystem ? "secondary" : "default"}>
            {voice.isSystem ? "System" : "Custom"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {voice.description || "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2">
          {/* Categories and Locales would be parsed from metadata if available, 
              for now we show generic placeholders or handle system voices specially */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="size-3" />
            <span>{voice.locale || "en-US"}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="size-3" />
            <span>{voice.category || "Narrative"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2"
            disabled={!voice.previewUrl}
            onClick={() => {
              if (voice.previewUrl) {
                const audio = new Audio(voice.previewUrl);
                audio.play();
              }
            }}
          >
            <Play className="size-4" />
            Preview
          </Button>
          <Button size="sm" className="w-full" onClick={handleSelect}>
            Select
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
