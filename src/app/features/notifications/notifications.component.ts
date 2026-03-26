import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page card">
      <div class="header flex-row items-center justify-between pb-md border-b">
        <h2>Notifications</h2>
        <button class="btn btn-outline" (click)="markAllAsRead()">Mark all as read</button>
      </div>

      <div class="notifications-list">
        @if (loading()) {
          @for (n of [1,2,3]; track $index) {
             <div class="notif-item skeleton-notif">
                <div class="skeleton circle"></div>
                <div class="skeleton-text">
                   <div class="skeleton line" style="width: 80%"></div>
                   <div class="skeleton line" style="width: 40%"></div>
                </div>
             </div>
          }
        } @else {
          @for (notif of notifications(); track notif.id) {
            <div class="notif-item flex-row gap-md" [class.unread]="!notif.read">
              <div class="notif-icon-wrapper">
                <span class="material-symbols-outlined icon-type" [ngClass]="notif.type.toLowerCase()">
                  {{getIcon(notif.type)}}
                </span>
              </div>
              <div class="notif-content flex-column">
                <p [innerHTML]="notif.content"></p>
                <span class="notif-time">{{notif.createdAt | date:'medium'}}</span>
              </div>
              @if (!notif.read) {
                <div class="unread-dot"></div>
              }
            </div>
          } @empty {
            <div class="empty-state text-center p-xl">
              <span class="material-symbols-outlined large">notifications_off</span>
              <p>You're all caught up!</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      padding: var(--spacing-lg);
    }
    .pb-md { padding-bottom: 24px; margin-bottom: 24px; }
    .border-b { border-bottom: 1px solid hsl(var(--border) / 0.5); }
    
    .notif-item {
      padding: 16px;
      border-radius: var(--radius-md);
      transition: background 0.2s;
      position: relative;
    }
    .notif-item:hover { background: hsl(var(--secondary) / 0.5); }
    .notif-item.unread { background: hsl(var(--primary) / 0.03); }

    .notif-icon-wrapper {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: hsl(var(--secondary));
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      background: hsl(var(--primary));
      border-radius: 50%;
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
    }

    .notif-content p { font-size: 14px; }
    .notif-time { font-size: 12px; color: hsl(var(--text-muted)); margin-top: 4px; }

    .icon-type.message { color: hsl(var(--primary)); }
    .icon-type.connection { color: hsl(var(--success)); }
    .icon-type.application { color: hsl(var(--primary)); }

    .skeleton-notif { display: flex; gap: 16px; align-items: center; padding: 16px; }
    .skeleton.circle { width: 40px; height: 40px; border-radius: 50%; }
    .skeleton-text { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .skeleton.line { height: 10px; }
    
    .large { font-size: 48px; color: hsl(var(--text-muted)); margin-bottom: 16px; }
  `]
})
export class NotificationsComponent implements OnInit {
  private http = inject(HttpClient);
  
  notifications = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchNotifications();
  }

  fetchNotifications() {
    this.http.get<any>('/api/notifications/my?page=0&size=20').subscribe({
      next: (resp) => {
        this.notifications.set(resp.content || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markAllAsRead() {
    this.http.put('/api/notifications/read-all', {}).subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'MESSAGE': return 'chat';
      case 'CONNECTION_REQUEST': return 'person_add';
      case 'APPLICATION_ACCEPTED': return 'check_circle';
      case 'APPLICATION_REJECTED': return 'cancel';
      default: return 'notifications';
    }
  }
}
