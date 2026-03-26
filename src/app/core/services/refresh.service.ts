import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { Observable, tap, throwError, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RefreshService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  refreshToken(): Observable<any> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<any>('/api/auth/refresh-token', { refreshToken }).pipe(
      tap((response) => {
        this.tokenService.saveTokens(response.accessToken, response.refreshToken);
      }),
      catchError((err) => {
        this.tokenService.clearTokens();
        return throwError(() => err);
      })
    );
  }
}
