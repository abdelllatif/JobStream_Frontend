import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminUserManagementComponent } from './admin-user-management.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminUserManagementComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {}
