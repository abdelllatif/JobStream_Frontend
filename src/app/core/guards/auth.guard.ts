import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

function resolveUser(authService: AuthService) {
  const user = authService.currentUserValue;
  if (user) return of(user);
  return authService.fetchCurrentUser();
}

function isAdminRole(role?: string): boolean {
  return role === 'ROLE_ADMIN' || role === 'ADMIN';
}

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return resolveUser(authService).pipe(
    map(user => {
      return router.createUrlTree([isAdminRole(user.role) ? '/admin/users' : '/job-feed']);
    }),
    catchError(() => of(router.createUrlTree(['/job-feed'])))
  );
};

export const nonAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return resolveUser(authService).pipe(
    map(user => {
      if (isAdminRole(user.role)) {
        return router.createUrlTree(['/admin/users']);
      }
      return true;
    }),
    catchError(() => of(true))
  );
};
