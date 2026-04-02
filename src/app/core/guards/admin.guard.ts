import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserValue;
  if (user) {
    const isAdmin = user.role === 'ROLE_ADMIN' || user.role === 'ADMIN';
    return isAdmin ? true : router.createUrlTree(['/job-feed']);
  }

  return authService.fetchCurrentUser().pipe(
    map(u => {
      const isAdmin = u.role === 'ROLE_ADMIN' || u.role === 'ADMIN';
      return isAdmin ? true : router.createUrlTree(['/job-feed']);
    }),
    catchError(() => of(router.createUrlTree(['/job-feed'])))
  );
};
