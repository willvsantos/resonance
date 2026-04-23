"use client";

import React, { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";

export function HistoryTable() {
  const trpc = useTRPC();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useInfiniteQuery(
    trpc.generation.list.infiniteQueryOptions(
      { limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    )
  );

  if (isPending) {
    return (
      <div className="flex justify-center p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-8 text-destructive">Failed to load generation history.</div>;
  }

  const items = data.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-card">
        <p className="text-muted-foreground">You haven't generated any audio yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]"></TableHead>
              <TableHead>Text</TableHead>
              <TableHead>Voice</TableHead>
              <TableHead className="text-right">Characters</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((generation) => (
              <React.Fragment key={generation.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPlayingId(playingId === generation.id ? null : generation.id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={generation.text}>
                    {generation.text}
                  </TableCell>
                  <TableCell>{generation.voiceName}</TableCell>
                  <TableCell className="text-right">{generation.characterCount}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {new Date(generation.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
                {playingId === generation.id && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-muted/30 p-4">
                      <AudioPlayer audioUrl={generation.audioUrl} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
