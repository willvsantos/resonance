import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/lib/db";
import { polar } from "@/lib/polar";
import { startOfMonth, endOfMonth } from "date-fns";

export const billingRouter = router({
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // Get the user's DB ID first
    const user = await db.user.findUnique({
      where: { clerkId: ctx.userId },
    });

    if (!user) return { characterCount: 0 };

    const result = await db.generation.aggregate({
      where: {
        OR: [
          { userId: user.id },
          { orgId: ctx.orgId, NOT: { orgId: null } },
        ],
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        characterCount: true,
      },
    });

    return {
      characterCount: result._sum.characterCount || 0,
    };
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Find user/org in Polar
      const user = await db.user.findUnique({
        where: { clerkId: ctx.userId },
      });
      
      const customerId = ctx.orgId ?? user?.id;
      if (!customerId) return null;

      const subscriptions = await polar.subscriptions.list({
        customerId: [customerId],
      });

      return subscriptions.result.items[0] || null;
    } catch (error) {
      console.error("[Polar] Failed to fetch subscription:", error);
      return null;
    }
  }),

  createCheckout: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.user.findUnique({
        where: { clerkId: ctx.userId },
      });
      
      if (!user) throw new Error("User not found");

      const checkout = await polar.checkouts.create({
        products: [input.productId],
        customerId: ctx.orgId ?? user.id,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      });

      return {
        url: checkout.url,
      };
    }),
});
