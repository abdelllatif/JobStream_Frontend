import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { CompanyService, Company } from '../../core/services/company.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private wsService = inject(WebSocketService);
  private companyService = inject(CompanyService);
  private router = inject(Router);

  myCompany = signal<Company | null>(null);
  sidebarOpen = signal(false);

  unreadMsgCount = computed(() => this.notifService.unreadMessageCount());
  unreadNotifCount = computed(() => this.notifService.unreadNotificationCount());

  private subs: Subscription[] = [];

  ngOnInit() {
    this.subs.push(
      this.wsService.notificationCount$.subscribe(counts => {
        this.notifService.setBadgeCounts(counts);
      })
    );

    this.authService.fetchCurrentUser().subscribe({
      next: (user) => {
        this.notifService.loadUnreadCounts();
        this.wsService.connect();
      },
      error: () => {}
    });

    this.companyService.getMyCompanies().subscribe({
      next: (companies) => {
        if (companies && companies.length > 0) {
          this.myCompany.set(companies[0]);
        }
      },
      error: () => {}
    });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.wsService.disconnect();
  }

  isAdmin(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
