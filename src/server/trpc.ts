import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import superjson from "superjson";

/**
 * Context creation — runs on every request
 */
export const createTRPCContext = async () => {
  const { userId, orgId } = await auth();
  return { userId, orgId };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Re-export reusable helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires Clerk authentication
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
