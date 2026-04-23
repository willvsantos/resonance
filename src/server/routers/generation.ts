import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";

export const generationRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      const limit = input.limit;
      const { cursor } = input;

      const items = await db.generation.findMany({
        take: limit + 1,
        where: {
          OR: [
            { userId: ctx.userId },
            { orgId: ctx.orgId, NOT: { orgId: null } },
          ],
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await db.generation.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.userId },
            { orgId: ctx.orgId, NOT: { orgId: null } },
          ],
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        voiceId: z.string(),
        voiceName: z.string(),
        parameters: z.object({
          temperature: z.number().default(0.7),
          topP: z.number().default(0.9),
          topK: z.number().default(50),
          repetitionPenalty: z.number().default(1.0),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const voice = await db.voice.findUnique({
        where: { id: input.voiceId },
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voice not found",
        });
      }

      const voiceKey = voice.isSystem
        ? `voices/system/${voice.id}.wav`
        : `voices/custom/${voice.id}.wav`;

      const apiUrl = process.env.CHATTERBOX_API_URL;
      const apiKey = process.env.CHATTERBOX_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "TTS API is not configured properly",
        });
      }

      const response = await fetch(`${apiUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt: input.text,
          voice_key: voiceKey,
          temperature: input.parameters.temperature,
          top_p: input.parameters.topP,
          top_k: input.parameters.topK,
          repetition_penalty: input.parameters.repetitionPenalty,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `TTS API error: ${errorText}`,
        });
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      const { createId } = await import("@paralleldrive/cuid2");
      const generationId = createId();
      
      const { uploadToR2 } = await import("@/lib/r2");
      const r2Key = `generations/${generationId}.wav`;
      const audioUrl = await uploadToR2(r2Key, audioBuffer, "audio/wav");

      // Wait! We should find the actual db user ID
      const user = await db.user.findUnique({
        where: { clerkId: ctx.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found in DB",
        });
      }

      const generation = await db.generation.create({
        data: {
          id: generationId,
          text: input.text,
          audioUrl,
          characterCount: input.text.length,
          voiceId: input.voiceId,
          voiceName: input.voiceName,
          userId: user.id,
          orgId: ctx.orgId,
          parameters: input.parameters,
        },
      });

      // Track usage in Polar (fire and forget)
      const { trackUsage } = await import("@/lib/polar");
      trackUsage(ctx.orgId ?? user.id, input.text.length).catch((err) => {
        console.error("[Polar] Failed to track usage:", err);
      });

      return generation;
    }),
});
