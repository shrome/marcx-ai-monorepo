import { router } from '@/trpc/init';
import { create } from './create';
import { findAll } from './findAll';
import { findOne } from './findOne';
import { update } from './update';
import { remove } from './remove';

export const caseRouter = router({
  create,
  findAll,
  findOne,
  update,
  remove,
  // Note: addAttachments should be called directly via backend client
  // due to file upload requirements
});
