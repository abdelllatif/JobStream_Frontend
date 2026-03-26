import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class UserBlockService {
  private http = inject(HttpClient);

  blockUser(blockedId: string): Observable<void> {
    return this.http.post<void>(`/api/blocks/${blockedId}`, {});
  }

  unblockUser(blockedId: string): Observable<void> {
    return this.http.delete<void>(`/api/blocks/${blockedId}`);
  }

  getBlockedUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/blocks/my');
  }
}
