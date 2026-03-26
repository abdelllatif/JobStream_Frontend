import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.model';

export interface ConnectionRequest {
  receiverId: string;
}

export type ConnectionStatus = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'BLOCKED';

export interface ConnectionStatusResponse {
  status: ConnectionStatus;
  connectionId?: string;
}

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  private http = inject(HttpClient);

  sendConnectionRequest(request: ConnectionRequest): Observable<any> {
    return this.http.post('/api/connections/request', request);
  }

  // Backend: PUT /api/connections/:id/accept  (id = connection record id)
  acceptConnection(connectionId: string): Observable<any> {
    return this.http.put(`/api/connections/${connectionId}/accept`, {});
  }

  // Backend: PUT /api/connections/:id/reject  (id = connection record id)
  rejectConnection(connectionId: string): Observable<any> {
    return this.http.put(`/api/connections/${connectionId}/reject`, {});
  }

  removeConnection(connectionId: string): Observable<any> {
    return this.http.delete(`/api/connections/${connectionId}`);
  }

  getConnections(): Observable<User[]> {
    return this.http.get<User[]>('/api/connections/my');
  }

  getPendingRequests(): Observable<any[]> {
    return this.http.get<any[]>('/api/connections/pending');
  }

  // New: check connection status with a specific user
  getConnectionStatus(userId: string): Observable<ConnectionStatusResponse> {
    return this.http.get<ConnectionStatusResponse>(`/api/connections/status/${userId}`);
  }
}
