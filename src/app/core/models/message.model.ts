import { User } from './auth.model';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail?: string;
  senderPhotoUrl?: string;
  content: string;
  jobId?: string;
  jobTitle?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
}
