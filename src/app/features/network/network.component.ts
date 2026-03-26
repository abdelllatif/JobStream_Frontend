import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserBlockService } from '../../core/services/user-block.service';
import { ConnectionService, ConnectionRequest } from '../../core/services/connection.service';
import { User } from '../../core/models/auth.model';
import { CandidateProfile } from '../../core/models/candidate-profile.model';
import { CandidateProfileService } from '../../core/services/candidate-profile.service';
import { NotifyService } from '../../core/services/notify.service';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Search and Header -->
      <div class="mb-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h2 class="text-3xl font-black text-slate-900 mb-2">Découvrez votre réseau</h2>
        <p class="text-slate-500 mb-6 font-medium">Connectez-vous avec des professionnels de votre secteur.</p>
        
        <div class="relative max-w-xl">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="onSearch()"
            placeholder="Rechercher par email ou rôle..." 
            class="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 font-medium transition-all shadow-inner"
          >
          <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </div>

      <!-- Suggested Connections -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        @if (loading()) {
          @for (n of [1,2,3,4,5,6,7,8]; track $index) {
            <div class="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
              <div class="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4"></div>
              <div class="h-4 bg-slate-100 rounded w-3/4 mx-auto mb-2"></div>
              <div class="h-3 bg-slate-100 rounded w-1/2 mx-auto mb-6"></div>
              <div class="h-10 bg-slate-100 rounded-xl w-full"></div>
            </div>
          }
        } @else {
          @for (user of users(); track user.id) {
            <div class="group bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden" (click)="goToProfile(user)">
              <div class="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-primary-500/10 to-blue-500/10"></div>
              
              <div class="relative mb-4 mt-2">
                <img [src]="user.profile?.photoUrl || 'https://ui-avatars.com/api/?name=' + user.email" 
                     alt="Avatar" 
                     class="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover">
                <div *ngIf="user.enabled" class="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>

              <h3 class="font-bold text-slate-900 text-lg line-clamp-1 mb-1">{{ user.email.split('@')[0] }}</h3>
              <p class="text-sm text-primary-600 font-bold mb-4 uppercase tracking-wider">{{ user.role }}</p>
              
              <p class="text-xs text-slate-500 mb-6 h-8 line-clamp-2 italic px-2">
                {{ user.profile?.headline || 'Prêt pour de nouvelles opportunités' }}
              </p>

              <div class="w-full space-y-2 mt-auto">
                <button class="w-full py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 active:scale-95 transition-all shadow-md shadow-primary-500/20"
                        (click)="connect(user, $event)">
                  Se connecter
                </button>
                <button class="w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                        (click)="blockUser(user, $event)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                  Bloquer
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Empty State -->
      @if (!loading() && users().length === 0) {
        <div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 mt-8">
          <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-1">Aucun utilisateur trouvé</h3>
          <p class="text-slate-500">Essayez d'élargir votre recherche ou revenez plus tard.</p>
        </div>
      }
    </div>
  `,
  styles: []
})
export class NetworkComponent implements OnInit {
  private http = inject(HttpClient);
  private blockService = inject(UserBlockService);
  private connectionService = inject(ConnectionService);
  private profileService = inject(CandidateProfileService);
  private notifyService = inject(NotifyService);
  private router = inject(Router);
  
  users = signal<User[]>([]);
  loading = signal<boolean>(true);
  searchQuery = '';

  ngOnInit() {
    this.fetchSuggestedUsers();
  }

  private enrichUsersWithProfiles(users: User[]): Observable<User[]> {
    if (!users?.length) return of(users);

    return forkJoin(
      users.map((u) =>
        this.profileService.getProfileByUserId(u.id).pipe(
          catchError(() => of(null as CandidateProfile | null))
        )
      )
    ).pipe(
      map((profiles) =>
        users.map((u, i) => ({
          ...u,
          // Ensure profile contains URLs (photoUrl/headline/cvUrl/etc.)
          profile: profiles[i] ?? u.profile ?? undefined
        }))
      )
    );
  }

  fetchSuggestedUsers() {
    this.loading.set(true);
    // Endpoint: GET /api/users/network
    this.http.get<any>('/api/users/network').subscribe({
      next: (resp) => {
        const rawUsers: User[] = resp?.content || resp || [];
        this.enrichUsersWithProfiles(rawUsers).subscribe(
          (enriched) => {
            this.users.set(enriched);
            this.loading.set(false);
          },
          () => {
            // Fallback: render basic network users even if enrichment fails
            this.users.set(rawUsers);
            this.loading.set(false);
          }
        );
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.fetchSuggestedUsers();
      return;
    }
    this.loading.set(true);
    // Endpoint: GET /api/users/search?query=...
    this.http.get<any>(`/api/users/search?query=${this.searchQuery}`).subscribe({
      next: (resp) => {
        const rawUsers: User[] = resp?.content || resp || [];
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
      },
      error: () => this.loading.set(false)
    });
  }

  connect(user: User, event?: Event) {
    event?.stopPropagation();
    const request: ConnectionRequest = { receiverId: user.id };
    this.connectionService.sendConnectionRequest(request).subscribe({
      next: () => {
        this.notifyService.showToast(`Demande envoyée à ${user.email}`, 'success');
        // Optionally update the user's local connection status so the UI can change to "Pending"
        const updatedUsers = this.users().map(u => {
          if (u.id === user.id) {
            return { ...u, connectionStatus: 'PENDING_SENDER' }; 
          }
          return u;
        });
        this.users.set(updatedUsers);
      },
      error: () => {
        this.notifyService.showError('Erreur', "Impossible d'envoyer la demande de connexion.");
      }
    });
  }

  goToProfile(user: User) {
    this.router.navigate(['/profile', user.id]);
  }

  blockUser(user: User, event?: Event) {
    event?.stopPropagation();
    this.notifyService.confirm('Bloquer cet utilisateur?', 'Il ne pourra plus voir votre profil.', () => {
      this.blockService.blockUser(user.id).subscribe({
        next: () => {
          this.users.set(this.users().filter(u => u.id !== user.id));
          this.notifyService.showToast('Utilisateur bloqué', 'success');
        },
        error: () => this.notifyService.showError('Erreur', "Impossible de bloquer l'utilisateur.")
      });
    });
  }
}
