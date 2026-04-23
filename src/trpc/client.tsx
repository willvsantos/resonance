"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import {
  createTRPCContext,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers/_app";
import { getQueryClient } from "./query-client";

const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

export { useTRPC, useTRPCClient };

export function TRPCProvider_({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
    ],
  });

  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TRPCProvider>
  );
}

/**
 * Server-side tRPC caller (for Server Components)
 */
export const serverClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/trpc`,
      transformer: superjson,
    }),
  ],
});

/**
 * tRPC proxy for use with TanStack Query options (Server Components)
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: serverClient,
  queryClient: getQueryClient,
});
