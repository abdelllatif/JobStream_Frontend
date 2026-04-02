import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message, Conversation } from '../models/message.model';

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  jobId?: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);

  pendingConversationId = signal<string | null>(null);

  getMyConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>('/api/conversations/my');
  }

  findOrCreateConversation(targetUserId: string): Observable<Conversation> {
    return this.http.post<Conversation>('/api/conversations/find-or-create', { targetUserId });
  }

  sendMessage(request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>('/api/messages', request);
  }

  getMessages(conversationId: string, page: number = 0, size: number = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,asc');
    return this.http.get<any>(`/api/messages/${conversationId}`, { params });
  }

  markConversationAsRead(conversationId: string): Observable<any> {
    return this.http.put(`/api/messages/read/${conversationId}`, {});
  }
}
