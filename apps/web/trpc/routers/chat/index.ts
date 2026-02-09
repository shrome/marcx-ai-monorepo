import { router } from '@/trpc/init';
import { createMessage } from './createMessage';
import { getMessages } from './getMessages';
import { deleteMessage } from './deleteMessage';

export const chatRouter = router({
  createMessage,
  getMessages,
  deleteMessage,
  // Note: addAttachments should be called directly via backend client
  // due to file upload requirements
});
