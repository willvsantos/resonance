"use client";

import { Generation, Voice } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AudioPlayer } from "@/components/audio-player";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

type GenerationWithVoice = Generation & {
  voice: Voice;
};

export function HistoryTable({ generations }: { generations: GenerationWithVoice[] }) {
  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground">
        <p>No generations found yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Voice</TableHead>
            <TableHead>Text</TableHead>
            <TableHead>Characters</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Audio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {generations.map((gen) => (
            <TableRow key={gen.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{gen.voice.name}</span>
                  <Badge variant="outline" className="w-fit text-[10px] h-4">
                    {gen.voice.isSystem ? "System" : "Custom"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="max-w-md">
                <p className="truncate text-sm" title={gen.text}>
                  {gen.text}
                </p>
              </TableCell>
              <TableCell>{gen.characterCount}</TableCell>
              <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                {formatDistanceToNow(new Date(gen.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right min-w-[300px]">
                <AudioPlayer audioUrl={gen.audioUrl} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
