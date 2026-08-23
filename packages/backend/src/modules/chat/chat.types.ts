export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  DELETED = "DELETED",
}

export enum ChatRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export interface IConversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  status: MessageStatus;
  isPinned?: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: ChatRequestStatus;
  message?: string | null;
  expiresAt: Date;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  createdAt: Date;
}

export interface ISendMessagePayload {
  conversationId: string;
  content: string;
}

export interface IChatReport {
  messageId?: string;
  conversationId?: string;
  reason: string;
  description?: string;
}
