import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  senderId?: string;
  senderName?: string;
  senderPhoto?: string;
  referenceId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);

  // Reactive unread count signal — update from backend
  unreadCount = signal<number>(0);

  getMyNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>('/api/notifications/my');
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>('/api/notifications/unread-count').pipe(
      tap((count) => this.unreadCount.set(count))
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`/api/notifications/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>('/api/notifications/read-all', {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  // Called when a WebSocket notification arrives — increments local count
  increment() {
    this.unreadCount.update(c => c + 1);
  }

  reset() {
    this.unreadCount.set(0);
  }
}
