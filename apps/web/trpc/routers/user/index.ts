import { router } from '@/trpc/init';
import { getCurrentUser } from './getCurrentUser';
import { findOne } from './findOne';
import { update } from './update';

export const userRouter = router({
  getCurrentUser,
  findOne,
  update,
});
