import "server-only"

import { createServerSideHelpers } from '@trpc/react-query/server';
import { headers } from "next/headers"
import { createTRPCContext, createCallerFactory } from "./init"
import { appRouter } from "./routers"
import superjson from "superjson";
import { cache } from "react";

const createCaller = createCallerFactory(appRouter);

export const caller = createCaller(async () => {
  const headersList = await headers()
  return createTRPCContext({ headers: headersList });
});

export const getReactQueryHelper = cache(async () =>{
  const headersList = await headers()
  const context = await createTRPCContext({ headers: headersList })

  return createServerSideHelpers({
    router: appRouter,
    ctx: await createTRPCContext({ headers: headersList }),
    transformer: superjson,
  });
});