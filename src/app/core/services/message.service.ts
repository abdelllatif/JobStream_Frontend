import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message, Conversation } from '../models/message.model';

export interface SendMessageRequest {
  recipientId: string;
  content: string;
}

export interface ConversationRequest {
  participantId: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);

  // Conversation Endpoints
  getMyConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>('/api/conversations/my');
  }

  findOrCreateConversation(participantId: string): Observable<Conversation> {
    return this.http.post<Conversation>('/api/conversations/find-or-create', { participantId });
  }

  // Message Endpoints
  sendMessage(request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>('/api/messages', request);
  }

  getMessages(conversationId: string, page: number = 0, size: number = 50): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>(`/api/messages/${conversationId}`, { params });
  }

  markConversationAsRead(conversationId: string): Observable<number> {
    return this.http.put<number>(`/api/messages/read/${conversationId}`, {});
  }
}
