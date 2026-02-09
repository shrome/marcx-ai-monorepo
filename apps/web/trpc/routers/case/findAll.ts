import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

export const findAll = protectedProcedure.query(async () => {
  const backend = createBackendClient();
  return await backend.case.findAll();
});
