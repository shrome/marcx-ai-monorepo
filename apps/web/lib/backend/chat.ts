import { Backend } from './base';
import { CreateMessageDto, Message } from './types';

export class ChatClient extends Backend {
  /**
   * Create a new message in a chat session with optional file attachments
   */
  async createMessage(
    sessionId: string,
    data: CreateMessageDto,
    files?: File[],
  ): Promise<Message> {
    const formData = new FormData();
    
    // Append message data
    formData.append('content', data.content);
    
    // Append files if provided
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }
    
    return this.postFormData<Message>(
      `/chat/sessions/${sessionId}/messages`,
      formData,
    );
  }

  /**
   * Get all messages in a chat session
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    return this.get<Message[]>(`/chat/sessions/${sessionId}/messages`);
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(messageId: string): Promise<{ message: string }> {
    return this.delete(`/chat/messages/${messageId}`);
  }

  /**
   * Add attachments to an existing chat message
   */
  async addAttachments(
    sessionId: string,
    chatId: string,
    files: File[],
  ): Promise<any> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    return this.postFormData(
      `/chat/sessions/${sessionId}/messages/${chatId}/attachments`,
      formData,
    );
  }
}
