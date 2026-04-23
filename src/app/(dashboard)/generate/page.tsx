"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { AudioLines, Loader2 } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";

function GenerateContent() {
  const searchParams = useSearchParams();
  const initialVoiceId = searchParams.get("voiceId") || "";

  const [voiceId, setVoiceId] = useState<string>(initialVoiceId);
  const [text, setText] = useState("");
  const [temperature, setTemperature] = useState([0.8]);
  const [topP, setTopP] = useState([0.95]);
  const [topK, setTopK] = useState([1000]);
  const [repetitionPenalty, setRepetitionPenalty] = useState([1.2]);
  
  const trpc = useTRPC();
  
  const { data: systemVoices } = useQuery(trpc.voice.listSystem.queryOptions());
  const { data: customVoices } = useQuery(trpc.voice.listCustom.queryOptions());

  const generateMutation = useMutation(trpc.generation.create.mutationOptions());

  useEffect(() => {
    if (initialVoiceId && !voiceId) {
      setVoiceId(initialVoiceId);
    }
  }, [initialVoiceId, voiceId]);

  const handleGenerate = () => {
    if (!voiceId) return;
    
    // Find the voice name
    const selectedVoice = [...(systemVoices || []), ...(customVoices || [])].find(v => v.id === voiceId);
    
    generateMutation.mutate({
      text,
      voiceId,
      voiceName: selectedVoice?.name || "Unknown Voice",
      parameters: {
        temperature: temperature[0],
        topP: topP[0],
        topK: topK[0],
        repetitionPenalty: repetitionPenalty[0],
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Speech</h1>
        <p className="text-muted-foreground mt-2">
          Convert your text into lifelike speech with the power of AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice">Voice</Label>
                <Select value={voiceId} onValueChange={(v) => setVoiceId(v || "")}>
                  <SelectTrigger id="voice">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemVoices && systemVoices.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>System Voices</SelectLabel>
                        {systemVoices.map(voice => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} {voice.category ? `(${voice.category})` : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {customVoices && customVoices.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Your Voices</SelectLabel>
                        {customVoices.map(voice => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="text">Text to Generate</Label>
                  <span className="text-xs text-muted-foreground">{text.length} characters</span>
                </div>
                <Textarea 
                  id="text"
                  placeholder="Type or paste your script here..."
                  className="min-h-[200px] resize-y"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {generateMutation.isSuccess && generateMutation.data && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Generated Audio</CardTitle>
              </CardHeader>
              <CardContent>
                <AudioPlayer audioUrl={generateMutation.data.audioUrl} />
              </CardContent>
            </Card>
          )}
          
          {generateMutation.isError && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6 text-destructive">
                Failed to generate speech: {generateMutation.error.message}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AudioLines className="size-5" />
                Settings
              </CardTitle>
              <CardDescription>Fine-tune the voice output</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Creativity (Temperature)</Label>
                  <span className="text-sm text-muted-foreground">{temperature[0]}</span>
                </div>
                <Slider 
                  min={0} max={2.0} step={0.1} 
                  value={temperature} onValueChange={(v) => setTemperature(v as number[])} 
                />
                <p className="text-xs text-muted-foreground">Higher values make output more random.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Variety (Top P)</Label>
                  <span className="text-sm text-muted-foreground">{topP[0]}</span>
                </div>
                <Slider 
                  min={0} max={1.0} step={0.05} 
                  value={topP} onValueChange={(v) => setTopP(v as number[])} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Expression (Top K)</Label>
                  <span className="text-sm text-muted-foreground">{topK[0]}</span>
                </div>
                <Slider 
                  min={1} max={10000} step={1} 
                  value={topK} onValueChange={(v) => setTopK(v as number[])} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Flow (Repetition Penalty)</Label>
                  <span className="text-sm text-muted-foreground">{repetitionPenalty[0]}</span>
                </div>
                <Slider 
                  min={1.0} max={2.0} step={0.05} 
                  value={repetitionPenalty} onValueChange={(v) => setRepetitionPenalty(v as number[])} 
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full" 
            size="lg"
            disabled={!voiceId || !text || generateMutation.isPending}
            onClick={handleGenerate}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Speech"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <GenerateContent />
    </Suspense>
  );
}
