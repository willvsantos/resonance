import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";

export const voiceRouter = router({
  listSystem: publicProcedure.query(async () => {
    return await db.voice.findMany({
      where: { isSystem: true },
      orderBy: { name: "asc" },
    });
  }),

  listCustom: protectedProcedure.query(async ({ ctx }) => {
    return await db.voice.findMany({
      where: {
        OR: [
          { userId: ctx.userId },
          { orgId: ctx.orgId, NOT: { orgId: null } },
        ],
        isSystem: false,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.voice.findUnique({
        where: { id: input.id },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        previewUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.user.findUnique({
        where: { clerkId: ctx.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found in DB",
        });
      }

      return await db.voice.create({
        data: {
          name: input.name,
          description: input.description,
          previewUrl: input.previewUrl,
          userId: user.id,
          orgId: ctx.orgId,
        },
      });
    }),

  clone: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        audioBase64: z.string().min(1),
        audioMimeType: z.enum(["audio/wav", "audio/mpeg", "audio/ogg", "audio/webm", "audio/mp4"]), // adding audio/mp4 as some browsers record webm/mp4
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.user.findUnique({
        where: { clerkId: ctx.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found in DB",
        });
      }

      const { createId } = await import("@paralleldrive/cuid2");
      const voiceId = createId();

      // Ensure base64 is clean (strip data URL prefix if present)
      const base64Data = input.audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      const audioBuffer = Buffer.from(base64Data, "base64");
      
      const { uploadToR2 } = await import("@/lib/r2");
      const r2Key = `voices/custom/${voiceId}.wav`;
      const previewUrl = await uploadToR2(r2Key, audioBuffer, input.audioMimeType);

      return await db.voice.create({
        data: {
          id: voiceId,
          name: input.name,
          description: input.description,
          previewUrl,
          isSystem: false,
          userId: user.id,
          orgId: ctx.orgId,
        },
      });
    }),
});
