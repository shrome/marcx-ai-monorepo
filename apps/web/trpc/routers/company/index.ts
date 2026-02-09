import { router } from '@/trpc/init';
import { create } from './create';
import { register } from './register';
import { findAll } from './findAll';
import { findOne } from './findOne';
import { update } from './update';
import { remove } from './remove';
import { getUsers } from './getUsers';
import { getSessions } from './getSessions';

export const companyRouter = router({
  create,
  register,
  findAll,
  findOne,
  update,
  remove,
  getUsers,
  getSessions,
});
