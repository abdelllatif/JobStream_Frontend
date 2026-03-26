import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.currentUserValue?.role;
  const isAdmin = role === 'ROLE_ADMIN' || role === 'ADMIN';

  if (isAdmin) return true;
  return router.navigate(['/job-feed']);
};

