import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { NotifyService } from '../../core/services/notify.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private notifyService = inject(NotifyService);
  private wsService = inject(WebSocketService);
  private router = inject(Router);

  notifications = signal<Notification[]>([]);
  loading = signal<boolean>(true);

  unreadCount = computed(() => this.notificationService.unreadNotificationCount());

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.fetchNotifications();

    this.subs.push(
      this.wsService.notification$.subscribe(notif => {
        if (notif.type !== 'MESSAGE') {
          this.notifications.update(list => [notif, ...list]);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  fetchNotifications() {
    this.loading.set(true);
    this.notificationService.getMyNotifications().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications.filter(n => n.type !== 'MESSAGE'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      },
      error: () => {
        this.notifyService.showError('Error', 'Failed to mark notification as read');
      }
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.notifyService.showToast('All notifications marked as read', 'success');
      },
      error: () => {
        this.notifyService.showError('Error', 'Failed to mark all notifications as read');
      }
    });
  }

  getIconComponent(type: string): string {
    switch (type) {
      case 'CONNECTION_REQUEST': return 'connection';
      case 'CONNECTION_ACCEPTED': return 'connection_accepted';
      case 'APPLICATION_ACCEPTED': return 'application';
      case 'APPLICATION_REJECTED': return 'application';
      case 'JOB_APPLICATION': return 'job_application';
      default: return 'default';
    }
  }

  getNotificationText(notification: Notification): string {
    return notification.content;
  }

  onNotificationClick(notif: Notification) {
    if (!notif.isRead) {
      this.markAsRead(notif.id);
    }
    switch (notif.type) {
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
        this.router.navigate(['/network']);
        break;
      case 'APPLICATION_ACCEPTED':
      case 'APPLICATION_REJECTED':
      case 'JOB_APPLICATION':
        this.router.navigate(['/job-feed']);
        break;
      case 'MESSAGE':
        this.router.navigate(['/messages']);
        break;
      default:
        break;
    }
  }
}
