import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout-wrapper">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="navbar-container flex-row items-center justify-between">
          <div class="flex-row items-center gap-lg flex-1">
            <div class="logo" routerLink="/">
              <span class="logo-text">Job<span>Stream</span></span>
            </div>
            
            <!-- Global Search -->
            <div class="navbar-search">
              <span class="material-symbols-outlined">search</span>
              <input type="text" placeholder="Search">
            </div>
          </div>

          <div class="nav-actions flex-row items-center gap-md">
            <!-- Icon shortcuts (Like LinkedIn) -->
            <div class="nav-icons flex-row gap-sm hide-mobile">
               <button class="btn-icon" title="Home" routerLink="/job-feed"><span class="material-symbols-outlined">home</span></button>
               <button class="btn-icon" title="Network" routerLink="/network"><span class="material-symbols-outlined">group</span></button>
               <button class="btn-icon" title="Messages" routerLink="/messages"><span class="material-symbols-outlined">chat</span></button>
            </div>

            <button class="btn-icon" (click)="authService.logout()" title="Logout">
              <span class="material-symbols-outlined">logout</span>
            </button>
            
            <div class="user-avatar" *ngIf="authService.currentUser() as user">
              <img [src]="user.photoUrl || 'assets/default-avatar.png'" alt="Avatar">
            </div>
          </div>
        </div>
      </nav>

      <div class="container main-content-grid">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-card card">
            <ul class="nav-list">
              <li>
                <a routerLink="/job-feed" routerLinkActive="active" class="nav-item">
                  <span class="material-symbols-outlined">work</span>
                  <span>Job Feed</span>
                </a>
              </li>
              <li>
                <a routerLink="/network" routerLinkActive="active" class="nav-item">
                  <span class="material-symbols-outlined">group</span>
                  <span>Network</span>
                </a>
              </li>
              <li>
                <a routerLink="/messages" routerLinkActive="active" class="nav-item">
                  <span class="material-symbols-outlined">chat</span>
                  <span>Messages</span>
                  <span class="badge" *ngIf="unreadMessages() > 0">{{unreadMessages()}}</span>
                </a>
              </li>
              <li>
                <a routerLink="/notifications" routerLinkActive="active" class="nav-item">
                  <span class="material-symbols-outlined">notifications</span>
                  <span>Notifications</span>
                  <span class="badge" *ngIf="unreadNotifications() > 0">{{unreadNotifications()}}</span>
                </a>
              </li>
              <li>
                <a routerLink="/profile" routerLinkActive="active" class="nav-item">
                  <span class="material-symbols-outlined">person</span>
                  <span>Profile</span>
                </a>
              </li>
              <li *ngIf="isRecruiter()">
                <a routerLink="/company-dashboard" routerLinkActive="active" class="nav-item recruiter-nav">
                  <span class="material-symbols-outlined">dashboard</span>
                  <span>Dashboard</span>
                </a>
              </li>
            </ul>
          </div>
        </aside>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      min-height: 100vh;
      background-color: hsl(var(--bg-main));
    }

    .navbar {
      background: hsl(var(--bg-card));
      border-bottom: 1px solid hsl(var(--border) / 0.8);
      height: 52px;
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      width: 100%;
    }

    .navbar-container {
      width: 100%;
      margin: 0 auto;
      padding: 0 40px;
    }

    .navbar-search {
      background: hsl(var(--secondary));
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      padding: 0 12px;
      height: 34px;
      width: 280px;
      gap: 8px;
    }

    .navbar-search input {
      background: none;
      border: none;
      width: 100%;
      font-size: 14px;
      padding: 4px 0;
    }

    .navbar-search input:focus { outline: none; }
    .navbar-search span { color: hsl(var(--text-muted)); font-size: 20px; }

    .logo {
      cursor: pointer;
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: hsl(var(--primary));
      flex-shrink: 0;
    }

    .logo-text span {
      color: hsl(var(--text-main));
    }

    .nav-icons {
      border-right: 1px solid hsl(var(--border));
      padding-right: 16px;
      margin-right: 8px;
    }

    .main-content-grid {
      display: grid;
      grid-template-columns: 225px 1fr;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-lg);
    }
    
    .hide-mobile { display: flex; }

    @media (max-width: 768px) {
      .navbar-search, .hide-mobile { display: none; }
      .main-content-grid { grid-template-columns: 1fr; }
      .sidebar { display: none; }
    }

    .sidebar {
      position: sticky;
      top: 76px;
      height: fit-content;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: var(--radius-sm);
      color: hsl(var(--text-muted));
      font-weight: 500;
      position: relative;
    }

    .nav-item:hover {
      background: hsl(var(--secondary));
      color: hsl(var(--text-main));
    }

    .nav-item.active {
      color: hsl(var(--text-main));
      font-weight: 600;
    }

    .nav-item.active::after {
      content: '';
      position: absolute;
      left: 0;
      height: 24px;
      width: 4px;
      background: hsl(var(--primary));
      border-radius: 0 4px 4px 0;
    }

    .badge {
      background: hsl(var(--error));
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: auto;
    }

    .user-avatar img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid hsl(var(--border));
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: hsl(var(--text-muted));
      display: flex;
      padding: 4px;
      border-radius: 50%;
    }

    .btn-icon:hover {
      background: hsl(var(--secondary));
      color: hsl(var(--text-main));
    }

    @media (max-width: 768px) {
      .main-content-grid {
        grid-template-columns: 1fr;
      }
      .sidebar {
        display: none;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  authService = inject(AuthService);
  notifService = inject(NotificationService);
  wsService = inject(WebSocketService);

  unreadMessages = () => 2; // Placeholder for now
  unreadNotifications = () => this.notifService.unreadCount();

  ngOnInit() {
    this.wsService.connect();
    // Simulate real-time notification
    setTimeout(() => {
      this.notifService.increment();
    }, 5000);
  }

  isRecruiter(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'ROLE_RECRUITER' || user?.role === 'ROLE_ADMIN';
  }
}
