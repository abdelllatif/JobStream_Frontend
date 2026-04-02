import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  entityId?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationCountResponse {
  notificationCount: number;
  messageCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);

  unreadNotificationCount = signal<number>(0);
  unreadMessageCount = signal<number>(0);

  setBadgeCounts(counts: NotificationCountResponse): void {
    this.unreadNotificationCount.set(counts.notificationCount);
    this.unreadMessageCount.set(counts.messageCount);
  }

  loadUnreadCounts(): void {
    this.http.get<NotificationCountResponse>('/api/notifications/unread-counts').subscribe({
      next: (counts) => this.setBadgeCounts(counts),
      error: () => {},
    });
  }

  getMyNotifications(page: number = 0, size: number = 20): Observable<Notification[]> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>('/api/notifications/my', { params }).pipe(
      map(resp => resp.content || resp || [])
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.put(`/api/notifications/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.put('/api/notifications/read-all', {});
  }

  markMessageNotificationsAsRead(): Observable<any> {
    return this.http.put('/api/notifications/read-messages', {});
  }
}
