import { router } from '@/trpc/init';
import { createChatSession } from './createChatSession';
import { create } from './create';
import { findAll } from './findAll';
import { findOne } from './findOne';
import { update } from './update';
import { remove } from './remove';

export const sessionRouter = router({
  createChatSession,
  create,
  findAll,
  findOne,
  update,
  remove,
});
