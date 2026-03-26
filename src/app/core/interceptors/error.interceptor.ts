import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RefreshService } from '../services/refresh.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !req.url.includes('/api/auth/refresh') && !req.url.includes('/api/auth/login')) {
        const refreshService = injector.get(RefreshService);
        const authService = injector.get(AuthService);
        return refreshService.refreshToken().pipe(
          switchMap(() => {
            // Retry the original request (authInterceptor will provide the new token)
            return next(req);
          }),
          catchError((refreshError) => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
