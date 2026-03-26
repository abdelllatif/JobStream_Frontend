import { User } from './auth.model';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  user1: User;
  user2: User;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}
