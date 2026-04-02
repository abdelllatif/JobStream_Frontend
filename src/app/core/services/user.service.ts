import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/auth.model';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }

  getAllUsers(page: number = 0, size: number = 20): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<User>>('/api/users/all', { params });
  }

  updateUserRole(id: string, role: string): Observable<User> {
    return this.http.put<User>(`/api/users/${id}/role`, { role });
  }

  disableUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }

  activateUser(id: string): Observable<void> {
    return this.http.put<void>(`/api/users/${id}/activate`, {});
  }

  getNetworkUsers(): Observable<any> {
    return this.http.get<any>('/api/users/network');
  }

  searchUsers(query: string): Observable<any> {
    return this.http.get<any>(`/api/users/search`, {
      params: new HttpParams().set('query', query)
    });
  }

  changePassword(currentPassword: string, newPassword: string, confirmedPassword: string): Observable<void> {
    return this.http.put<void>('/api/users/me/change-password', { currentPassword, newPassword, confirmedPassword });
  }

  hasPassword(): Observable<boolean> {
    return this.http.get<boolean>('/api/users/me/has-password');
  }

  setPassword(newPassword: string, confirmedPassword: string): Observable<void> {
    return this.http.post<void>('/api/users/me/set-password', { newPassword, confirmedPassword });
  }
}
