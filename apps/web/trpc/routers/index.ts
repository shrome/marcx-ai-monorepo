import { router } from '@/trpc/init';
import { authRouter } from './auth';
import { userRouter } from './user';
import { sessionRouter } from './session';
import { companyRouter } from './company';
import { chatRouter } from './chat';
import { caseRouter } from './case';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  session: sessionRouter,
  company: companyRouter,
  chat: chatRouter,
  case: caseRouter,
});

export type AppRouter = typeof appRouter;
