import { Routes } from '@angular/router';
import { authGuard, guestGuard, nonAdminGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'account-suspended',
    loadComponent: () => import('./features/auth/account-suspended/account-suspended.component').then(m => m.AccountSuspendedComponent)
  },
  {
    path: 'oauth2/callback',
    loadComponent: () => import('./features/auth/oauth2-callback/oauth2-callback.component').then(m => m.OAuth2CallbackComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/oauth2-callback/oauth2-callback.component').then(m => m.OAuth2CallbackComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'users',
        loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./features/admin/admin-change-password.component').then(m => m.AdminChangePasswordComponent)
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, nonAdminGuard],
    children: [
      {
        path: 'job-feed',
        loadComponent: () => import('./features/job-feed/job-feed.component').then(m => m.JobFeedComponent)
      },
      {
        path: 'my-applications',
        loadComponent: () => import('./features/my-applications/my-applications.component').then(m => m.MyApplicationsComponent)
      },
      {
        path: 'network',
        loadComponent: () => import('./features/network/network.component').then(m => m.NetworkComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'company-dashboard',
        loadComponent: () => import('./features/company-dashboard/company-dashboard.component').then(m => m.CompanyDashboardComponent)
      },
      {
        path: 'company-create',
        loadComponent: () => import('./features/company-create/company-create.component').then(m => m.CompanyCreateComponent)
      },
      {
        path: 'company/:id',
        loadComponent: () => import('./features/company-detail/company-detail.component').then(m => m.CompanyDetailComponent)
      },
      {
        path: 'recruitment-space',
        loadComponent: () => import('./features/recruitment-space/recruitment-space.component').then(m => m.RecruitmentSpaceComponent)
      },
      {
        path: 'recruitment/:companyId',
        loadComponent: () => import('./features/recruitment-space/recruitment-space.component').then(m => m.RecruitmentSpaceComponent)
      },
      {
        path: '',
        redirectTo: 'job-feed',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];

