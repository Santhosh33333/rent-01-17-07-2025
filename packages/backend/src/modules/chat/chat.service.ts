import { Conversation, Message, ChatRequest } from "@prisma/client";
import { ChatRepository } from "./chat.repository";
import type { SendMessageDtoType, SendChatRequestDtoType, ChatReportDtoType, MessageQueryDtoType } from "./chat.dto";

export class ChatService {
  constructor(private repo: ChatRepository) {}

  async getConversations(userId: string): Promise<Conversation[]> {
    return this.repo.getConversations(userId);
  }

  async getConversationMessages(conversationId: string, userId: string, params: MessageQueryDtoType): Promise<{ messages: Message[]; total: number }> {
    const conversation = await this.repo.getConversationById(conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new Error("Not authorized to view this conversation");
    }
    await this.repo.markAsRead(conversationId, userId);
    return this.repo.getMessages(conversationId, params);
  }

  async sendMessage(senderId: string, data: SendMessageDtoType): Promise<Message> {
    const conversation = await this.repo.getConversationById(data.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    const receiverId =
      conversation.participant1Id === senderId
        ? conversation.participant2Id
        : conversation.participant1Id;
    return this.repo.createMessage({
      senderId,
      receiverId,
      conversationId: data.conversationId,
      content: data.content,
      status: "SENT",
    });
  }

  async deleteMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.repo.getMessage(messageId);
    if (!message) throw new Error("Message not found");
    if (message.senderId !== userId) throw new Error("Not authorized to delete this message");
    return this.repo.deleteMessage(messageId);
  }

  async pinMessage(_messageId: string, _pinned: boolean): Promise<Message> {
    // Message model doesn't have a pinned field in schema — return message as-is
    const message = await this.repo.getMessage(_messageId);
    if (!message) throw new Error("Message not found");
    return message;
  }

  async sendChatRequest(senderId: string, data: SendChatRequestDtoType): Promise<ChatRequest> {
    if (senderId === data.receiverId) throw new Error("Cannot send chat request to yourself");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.repo.createChatRequest({ senderId, receiverId: data.receiverId, message: data.message, expiresAt });
  }

  async getChatRequests(userId: string): Promise<ChatRequest[]> {
    return this.repo.getChatRequests(userId);
  }

  async acceptChatRequest(requestId: string, userId: string): Promise<ChatRequest> {
    return this.repo.updateChatRequest(requestId, "ACCEPTED");
  }

  async rejectChatRequest(requestId: string, userId: string): Promise<ChatRequest> {
    return this.repo.updateChatRequest(requestId, "REJECTED");
  }

  async reportChat(reporterId: string, data: ChatReportDtoType): Promise<void> {
    await this.repo.createChatReport({ reporterId, ...data });
  }
}
