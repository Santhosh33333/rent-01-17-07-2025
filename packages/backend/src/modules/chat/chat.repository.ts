import { PrismaClient, Conversation, Message, ChatRequest, ChatReport } from "@prisma/client";

export class ChatRepository {
  constructor(private prisma: PrismaClient) {}

  async findOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    const [p1, p2] = [participant1Id, participant2Id].sort();
    return this.prisma.conversation.upsert({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      create: { participant1Id: p1, participant2Id: p2 },
      update: {},
    });
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return this.prisma.conversation.findMany({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  async getMessages(conversationId: string, params: { page: number; limit: number }): Promise<{ messages: Message[]; total: number }> {
    const skip = (params.page - 1) * params.limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);
    return { messages, total };
  }

  async createMessage(data: {
    senderId: string;
    receiverId: string;
    conversationId: string;
    content: string;
    status: string;
  }): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  async getMessage(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({ where: { id } });
  }

  async deleteMessage(id: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: { status: "DELETED", content: "[Message deleted]" },
    });
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: { conversationId, receiverId: userId, status: { not: "READ" } },
      data: { status: "READ", readAt: new Date() },
    });
  }

  async createChatRequest(data: {
    senderId: string;
    receiverId: string;
    message?: string;
    expiresAt: Date;
  }): Promise<ChatRequest> {
    return this.prisma.chatRequest.create({ data: { ...data, status: "PENDING" } });
  }

  async getChatRequests(userId: string): Promise<ChatRequest[]> {
    return this.prisma.chatRequest.findMany({
      where: { receiverId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateChatRequest(id: string, status: string): Promise<ChatRequest> {
    return this.prisma.chatRequest.update({
      where: { id },
      data: {
        status,
        acceptedAt: status === "ACCEPTED" ? new Date() : undefined,
        rejectedAt: status === "REJECTED" ? new Date() : undefined,
      },
    });
  }

  async createChatReport(data: {
    reporterId: string;
    messageId?: string;
    conversationId?: string;
    reason: string;
    description?: string;
  }): Promise<ChatReport> {
    return this.prisma.chatReport.create({ data: { ...data, status: "PENDING" } });
  }
}
