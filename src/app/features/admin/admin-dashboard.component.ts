import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserManagementComponent } from './admin-user-management.component';
import { AdminProfileManagementComponent } from './admin-profile-management.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminUserManagementComponent, AdminProfileManagementComponent],
  template: `
    <div class="admin-page">
      <div class="header flex-row justify-between items-center mb-lg">
        <h1 class="text-2xl font-black text-slate-900">Admin Dashboard</h1>
      </div>

      <div class="tabs mb-lg">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'users'"
          (click)="activeTab.set('users')"
        >
          User Management
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'profiles'"
          (click)="activeTab.set('profiles')"
        >
          Profile Management
        </button>
      </div>

      <app-admin-user-management *ngIf="activeTab() === 'users'"></app-admin-user-management>
      <app-admin-profile-management *ngIf="activeTab() === 'profiles'"></app-admin-profile-management>
    </div>
  `,
  styles: [
    `
      .admin-page {
        padding: var(--spacing-lg);
        max-width: 1200px;
        margin: 0 auto;
      }
      .tabs {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      .tab-btn {
        padding: 10px 16px;
        background: hsl(var(--secondary));
        border: 1px solid hsl(var(--border));
        border-radius: 14px;
        font-weight: 800;
        color: hsl(var(--text-main));
        cursor: pointer;
        transition: transform 0.08s ease, background 0.15s ease;
      }
      .tab-btn:hover {
        transform: translateY(-1px);
      }
      .tab-btn.active {
        background: hsl(var(--primary) / 0.15);
        border-color: hsl(var(--primary));
      }
    `
  ]
})
export class AdminDashboardComponent {
  activeTab = signal<'users' | 'profiles'>('users');
}

