import { router, publicProcedure } from "@/server/trpc";
import { voiceRouter } from "./voice";
import { generationRouter } from "./generation";
import { billingRouter } from "./billing";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok" };
  }),
  voice: voiceRouter,
  generation: generationRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
