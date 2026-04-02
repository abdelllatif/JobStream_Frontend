import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserBlockService } from '../../core/services/user-block.service';
import { ConnectionService, ConnectionRequest } from '../../core/services/connection.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User, Connection } from '../../core/models/auth.model';
import { CandidateProfile } from '../../core/models/candidate-profile.model';
import { CandidateProfileService } from '../../core/services/candidate-profile.service';
import { NotifyService } from '../../core/services/notify.service';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent implements OnInit {
  private userService = inject(UserService);
  private blockService = inject(UserBlockService);
  private connectionService = inject(ConnectionService);
  private profileService = inject(CandidateProfileService);
  private authService = inject(AuthService);
  private notifyService = inject(NotifyService);
  private router = inject(Router);

  users = signal<User[]>([]);
  connections = signal<User[]>([]);
  pendingRequests = signal<Connection[]>([]);
  sentRequests = signal<Connection[]>([]);
  connectionStatusMap = signal<Map<string, { status: string; connectionId: string }>>(new Map());
  loading = signal<boolean>(true);
  searchQuery = '';
  activeTab = signal<'discover' | 'connections' | 'pending' | 'sent' | 'blocked'>('discover');
  blockedUsers = signal<User[]>([]);

  private get currentUserId(): string {
    return this.authService.currentUser()?.id || '';
  }

  ngOnInit() {
    this.loadNetworkData();
  }

  loadNetworkData() {
    this.loading.set(true);
    forkJoin({
      suggested: this.fetchSuggestedUsers(),
      connections: this.connectionService.getConnections().pipe(catchError(() => of([]))),
      pending: this.connectionService.getPendingRequests().pipe(catchError(() => of([]))),
      sent: this.connectionService.getSentPendingRequests().pipe(catchError(() => of([]))),
      blocked: this.blockService.getBlockedUsers().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ suggested, connections, pending, sent, blocked }) => {
        this.pendingRequests.set(pending || []);
        this.sentRequests.set(sent || []);
        this.blockedUsers.set(blocked || []);
        this.loading.set(false);
        const rawConnections: User[] = (connections || []).filter((c: any) => c && c.id);
        this.enrichUsersWithProfiles(rawConnections).subscribe(
          (enriched) => this.connections.set(enriched),
          () => this.connections.set(rawConnections)
        );
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private fetchSuggestedUsers(): Observable<User[]> {
    return this.userService.getNetworkUsers().pipe(
      map((resp) => {
        const rawUsers: User[] = resp?.content || resp || [];
        this.buildConnectionStatusMap(rawUsers);
        this.enrichUsersWithProfiles(rawUsers).subscribe(
          (enriched) => this.users.set(enriched),
          () => this.users.set(rawUsers)
        );
        return rawUsers;
      })
    );
  }

  private buildConnectionStatusMap(networkUsers: User[]) {
    const myId = this.currentUserId;
    const statusMap = new Map<string, { status: string; connectionId: string }>();

    for (const user of networkUsers) {
      if (!user.connections || user.connections.length === 0) {
        statusMap.set(user.id, { status: 'NONE', connectionId: '' });
        continue;
      }

      const conn = user.connections.find(
        c => (c.senderId === myId && c.receiverId === user.id) ||
             (c.receiverId === myId && c.senderId === user.id)
      );

      if (!conn) {
        statusMap.set(user.id, { status: 'NONE', connectionId: '' });
        continue;
      }

      if (conn.status === 'ACCEPTED') {
        statusMap.set(user.id, { status: 'ACCEPTED', connectionId: conn.id });
      } else if (conn.status === 'PENDING') {
        if (conn.senderId === myId) {
          statusMap.set(user.id, { status: 'PENDING_SENT', connectionId: conn.id });
        } else {
          statusMap.set(user.id, { status: 'PENDING_RECEIVED', connectionId: conn.id });
        }
      } else {
        statusMap.set(user.id, { status: 'NONE', connectionId: conn.id });
      }
    }

    this.connectionStatusMap.set(statusMap);
  }

  private enrichUsersWithProfiles(users: User[]): Observable<User[]> {
    if (!users?.length) return of(users);

    return forkJoin(
      users.map((u) =>
        u.id
          ? this.profileService.getProfileByUserId(u.id).pipe(
              catchError(() => of(null as CandidateProfile | null))
            )
          : of(null as CandidateProfile | null)
      )
    ).pipe(
      map((profiles) =>
        users.map((u, i) => ({
          ...u,
          profile: profiles[i] ?? u.profile ?? undefined
        }))
      )
    );
  }

  getConnectionStatusForUser(user: User): string {
    return this.connectionStatusMap().get(user.id)?.status || 'NONE';
  }

  private getConnectionIdForUser(userId: string): string {
    return this.connectionStatusMap().get(userId)?.connectionId || '';
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.fetchSuggestedUsers().subscribe();
      return;
    }
    this.loading.set(true);
    this.userService.searchUsers(this.searchQuery).pipe(
      catchError(() => of([]))
    ).subscribe((resp) => {
      const rawUsers: User[] = resp?.content || resp || [];
      this.buildConnectionStatusMap(rawUsers);
      this.enrichUsersWithProfiles(rawUsers).subscribe(
        (enriched) => {
          this.users.set(enriched);
          this.loading.set(false);
        },
        () => {
          this.users.set(rawUsers);
          this.loading.set(false);
        }
      );
    });
  }

  connect(user: User, event?: Event) {
    event?.stopPropagation();
    const request: ConnectionRequest = { receiverId: user.id };
    this.connectionService.sendConnectionRequest(request).subscribe({
      next: (response: any) => {
        this.notifyService.showToast(`Demande envoyée à ${this.getUserDisplayName(user)}`, 'success');

        const map = new Map(this.connectionStatusMap());
        const connId = response?.id || response?.connectionId || '';
        map.set(user.id, { status: 'PENDING_SENT', connectionId: connId });
        this.connectionStatusMap.set(map);

        const newSentRequest: Connection = {
          id: connId,
          senderId: this.currentUserId,
          senderEmail: this.authService.currentUser()?.email || '',
          senderPhotoUrl: this.authService.currentUser()?.photoUrl,
          receiverId: user.id,
          receiverEmail: user.email,
          receiverPhotoUrl: user.profile?.photoUrl || user.photoUrl,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
        this.sentRequests.update(list => [...list, newSentRequest]);
      },
      error: () => {
        this.notifyService.showError('Erreur', "Impossible d'envoyer la demande de connexion.");
      }
    });
  }

  cancelRequestForUser(user: User, event?: Event) {
    event?.stopPropagation();
    const connId = this.getConnectionIdForUser(user.id);
    if (!connId) return;
    this.cancelRequest(connId, user.id);
  }

  acceptRequestForUser(user: User, event?: Event) {
    event?.stopPropagation();
    const connId = this.getConnectionIdForUser(user.id);
    if (!connId) return;
    this.acceptRequest(connId, user.id);
  }

  rejectRequestForUser(user: User, event?: Event) {
    event?.stopPropagation();
    const connId = this.getConnectionIdForUser(user.id);
    if (!connId) return;
    this.rejectRequest(connId, user.id);
  }

  acceptRequest(requestId: string, userId?: string) {
    this.connectionService.acceptConnection(requestId).subscribe({
      next: () => {
        this.notifyService.showToast('Demande acceptée !', 'success');
        this.pendingRequests.update(r => r.filter(req => req.id !== requestId));
        if (userId) {
          const map = new Map(this.connectionStatusMap());
          map.set(userId, { status: 'ACCEPTED', connectionId: requestId });
          this.connectionStatusMap.set(map);
        }
        this.connectionService.getConnections().pipe(catchError(() => of([]))).subscribe(
          c => this.connections.set(c || [])
        );
      },
      error: () => this.notifyService.showError('Erreur', 'Impossible d\'accepter la demande.')
    });
  }

  rejectRequest(requestId: string, userId?: string) {
    this.connectionService.rejectConnection(requestId).subscribe({
      next: () => {
        this.notifyService.showToast('Demande refusée', 'info');
        this.pendingRequests.update(r => r.filter(req => req.id !== requestId));
        if (userId) {
          const map = new Map(this.connectionStatusMap());
          map.set(userId, { status: 'NONE', connectionId: '' });
          this.connectionStatusMap.set(map);
        }
      },
      error: () => this.notifyService.showError('Erreur', 'Impossible de refuser la demande.')
    });
  }

  cancelRequest(requestId: string, userId?: string) {
    this.connectionService.removeConnection(requestId).subscribe({
      next: () => {
        this.notifyService.showToast('Demande annulée', 'info');
        this.sentRequests.update(r => r.filter(req => req.id !== requestId));
        if (userId) {
          const map = new Map(this.connectionStatusMap());
          map.set(userId, { status: 'NONE', connectionId: '' });
          this.connectionStatusMap.set(map);
        }
      },
      error: () => this.notifyService.showError('Erreur', 'Impossible d\'annuler la demande.')
    });
  }

  goToProfile(user: any) {
    let userId = user?.id || user?.userId;
    if (!userId && user?.senderId && user?.receiverId) {
      userId = user.senderId === this.currentUserId ? user.receiverId : user.senderId;
    }
    if (!userId) return;
    this.router.navigate(['/profile', userId]);
  }

  blockUser(user: User, event?: Event) {
    event?.stopPropagation();
    this.notifyService.confirm('Bloquer cet utilisateur?', 'Il ne pourra plus voir votre profil.', () => {
      this.blockService.blockUser(user.id).subscribe({
        next: () => {
          this.users.set(this.users().filter(u => u.id !== user.id));
          this.connections.update(list => list.filter(u => u.id !== user.id));
          this.blockedUsers.update(list => [...list, user]);
          this.notifyService.showToast('Utilisateur bloqué', 'success');
        },
        error: () => this.notifyService.showError('Erreur', "Impossible de bloquer l'utilisateur.")
      });
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  getUserDisplayName(user: any): string {
    if (user.firstName) {
      return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'Utilisateur';
  }

  unblockUser(user: User, event?: Event) {
    event?.stopPropagation();
    this.blockService.unblockUser(user.id).subscribe({
      next: () => {
        this.blockedUsers.update(list => list.filter(u => u.id !== user.id));
        this.notifyService.showToast('Utilisateur débloqué', 'success');
      },
      error: () => this.notifyService.showError('Erreur', "Impossible de débloquer l'utilisateur.")
    });
  }

  removeConnection(user: User, event?: Event) {
    event?.stopPropagation();
    const connId = this.getConnectionIdForUser(user.id);
    if (!connId) return;
    this.notifyService.confirm('Retirer cette connexion?', 'Vous ne serez plus connectés.', () => {
      this.connectionService.removeConnection(connId).subscribe({
        next: () => {
          this.connections.update(list => list.filter(u => u.id !== user.id));
          const map = new Map(this.connectionStatusMap());
          map.set(user.id, { status: 'NONE', connectionId: '' });
          this.connectionStatusMap.set(map);
          this.notifyService.showToast('Connexion retirée', 'info');
        },
        error: () => this.notifyService.showError('Erreur', 'Impossible de retirer la connexion.')
      });
    });
  }
}
