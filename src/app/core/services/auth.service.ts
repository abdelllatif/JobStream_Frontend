import { Injectable, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap } from 'rxjs';

import { User, AuthResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  get user() {
    return this.currentUser;
  }

  get currentUserValue() {
    return this.currentUser();
  }

  constructor() {
    this.checkInitialAuth();
  }

  getCurrentUser(): Observable<User> {
    return this.fetchCurrentUser();
  }

  refreshUserData(): Observable<User> {
    return this.fetchCurrentUser();
  }

  private checkInitialAuth(): void {
    const token = this.tokenService.getAccessToken();
    if (token && !this.tokenService.isTokenExpired(token)) {
      this.isAuthenticated.set(true);
      this.fetchCurrentUser().subscribe();
    }
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>('/api/users/me').pipe(
      tap((user) => {
        this.currentUser.set({ ...user });
        this.isAuthenticated.set(true);
      })
    );
  }

  login(credentials: any): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap((response) => {
        this.tokenService.saveTokens(response.accessToken, response.refreshToken);
        this.isAuthenticated.set(true);
      }),
      switchMap(() => this.fetchCurrentUser())
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>('/api/auth/register', userData);
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/home']);
  }

  handleOAuth2Callback(token: string, refreshToken: string): void {
    this.tokenService.saveTokens(token, refreshToken);
    this.fetchCurrentUser().subscribe((user) => {
      const isAdmin = user.role === 'ROLE_ADMIN' || user.role === 'ADMIN';
      this.router.navigate([isAdmin ? '/admin' : '/job-feed']);
    });
  }
}
