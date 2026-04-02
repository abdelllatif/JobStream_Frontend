import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../core/models/auth.model';
import { UserService, PageResponse } from '../../core/services/user.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css']
})
export class AdminUserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private notifyService = inject(NotifyService);

  allUsers = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  loading = signal(false);

  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = 20;

  searchQuery = '';

  ngOnInit() {
    this.loadUsers(0);
  }

  loadUsers(page: number) {
    this.loading.set(true);
    this.userService.getAllUsers(page, this.pageSize).subscribe({
      next: (resp) => {
        const users = resp.content || [];
        this.allUsers.set(users);
        this.currentPage.set(resp.number ?? page);
        this.totalPages.set(resp.totalPages ?? 1);
        this.totalElements.set(resp.totalElements ?? users.length);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.allUsers.set([]);
        this.filteredUsers.set([]);
        this.loading.set(false);
        this.notifyService.showToast('Erreur lors du chargement des utilisateurs', 'error');
      }
    });
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.loadUsers(page);
    }
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredUsers.set(this.allUsers());
      return;
    }
    this.filteredUsers.set(
      this.allUsers().filter(u => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return name.includes(q) || (u.email || '').toLowerCase().includes(q);
      })
    );
  }

  promoteToAdmin(u: User) {
    const roleName = u.role?.startsWith('ROLE_') ? 'ROLE_ADMIN' : 'ADMIN';
    this.notifyService.confirm(
      `Promouvoir ${u.firstName || u.email} en Admin ?`,
      'Cette action donnera les droits administrateur à cet utilisateur.',
      () => {
        this.userService.updateUserRole(u.id, roleName).subscribe({
          next: (updated) => {
            this.allUsers.update(list => list.filter(x => x.id !== u.id));
            this.applyFilter();
            this.notifyService.showToast('Utilisateur promu en Admin', 'success');
          },
          error: () => {
            this.notifyService.showError('Erreur', 'Impossible de modifier le rôle.');
          }
        });
      }
    );
  }

  disableUser(u: User) {
    this.notifyService.confirm(
      `Désactiver le compte de ${u.firstName || u.email} ?`,
      'Le compte sera désactivé (l\'utilisateur ne pourra plus se connecter).',
      () => {
        this.userService.disableUser(u.id).subscribe({
          next: () => {
            this.allUsers.update(list =>
              list.map(x => x.id === u.id ? { ...x, enabled: false } : x)
            );
            this.applyFilter();
            this.notifyService.showToast('Compte désactivé', 'success');
          },
          error: () => {
            this.notifyService.showError('Erreur', 'Impossible de désactiver le compte.');
          }
        });
      }
    );
  }

  activateUser(u: User) {
    this.userService.activateUser(u.id).subscribe({
      next: () => {
        this.allUsers.update(list =>
          list.map(x => x.id === u.id ? { ...x, enabled: true } : x)
        );
        this.applyFilter();
        this.notifyService.showToast('Compte activé', 'success');
      },
      error: () => {
        this.notifyService.showError('Erreur', 'Impossible d\'activer le compte.');
      }
    });
  }

  formatRole(role: string): string {
    const r = (role || '').replace('ROLE_', '');
    switch (r) {
      case 'ADMIN': return 'Admin';
      case 'RECRUITER': return 'Recruteur';
      default: return 'Utilisateur';
    }
  }

  getRoleBadgeClass(role: string): string {
    const r = (role || '').replace('ROLE_', '');
    switch (r) {
      case 'ADMIN': return 'role-badge role-admin';
      case 'RECRUITER': return 'role-badge role-recruiter';
      default: return 'role-badge role-user';
    }
  }

  isAdmin(role: string): boolean {
    return role === 'ROLE_ADMIN' || role === 'ADMIN';
  }
}
