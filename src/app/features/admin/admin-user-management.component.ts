import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../core/models/auth.model';
import { UserService } from '../../core/services/user.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card p-6 rounded-xl bg-white shadow-sm border border-gray-200">
      <div class="flex-row justify-between items-start mb-md">
        <div>
          <h2 class="text-xl font-black text-slate-900 mb-2">User Management</h2>
          <p class="text-slate-600 text-sm">
            Search users by email or headline, then update role or delete the account.
          </p>
        </div>
      </div>

      <form
        class="search-row flex gap-3 mb-md"
        (ngSubmit)="search()"
      >
        <input
          type="text"
          name="query"
          [(ngModel)]="searchQuery"
          placeholder="Email or headline..."
          class="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
        />
        <button
          type="submit"
          class="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all"
        >
          Search
        </button>
      </form>

      <div *ngIf="loading()" class="text-slate-500 text-sm">Loading...</div>

      <div *ngIf="!loading()">
        @if (users().length === 0) {
          <div class="text-center py-8 text-slate-400 text-sm italic">No users found.</div>
        } @else {
          <div class="table-responsive">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-left">
                  <th class="py-3 text-xs font-black uppercase tracking-wider text-slate-500">User</th>
                  <th class="py-3 text-xs font-black uppercase tracking-wider text-slate-500">Email</th>
                  <th class="py-3 text-xs font-black uppercase tracking-wider text-slate-500">Role</th>
                  <th class="py-3 text-xs font-black uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr class="border-b border-slate-100">
                    <td class="py-3 text-sm text-slate-800 font-bold">
                      {{ u.firstName || '' }} {{ u.lastName || '' }}
                      <div class="text-xs text-slate-400 font-medium">{{ u.id }}</div>
                    </td>
                    <td class="py-3 text-sm text-slate-800">{{ u.email }}</td>
                    <td class="py-3">
                      <select
                        class="border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"
                        [(ngModel)]="roleDrafts[u.id]"
                        (ngModelChange)="roleDrafts[u.id] = $event"
                      >
                        @if (roleOptionsFor(u).length) {
                          @for (r of roleOptionsFor(u); track r) {
                            <option [ngValue]="r">{{ r }}</option>
                          }
                        } @else {
                          <option [ngValue]="'USER'">USER</option>
                          <option [ngValue]="'ADMIN'">ADMIN</option>
                        }
                      </select>
                    </td>
                    <td class="py-3">
                      <div class="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          class="px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 active:scale-95 transition-all text-xs"
                          (click)="updateRole(u)"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          class="px-4 py-2 bg-slate-50 text-red-600 font-bold rounded-lg hover:bg-red-50 active:scale-95 transition-all text-xs border border-red-100"
                          (click)="deleteUser(u)"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: white;
      }
      .table-responsive {
        overflow-x: auto;
      }
      .flex-row {
        display: flex;
      }
      .flex {
        display: flex;
      }
      .items-start {
        align-items: flex-start;
      }
      .items-center {
        align-items: center;
      }
      .justify-between {
        justify-content: space-between;
      }
      .gap-3 {
        gap: 12px;
      }
      .mb-md {
        margin-bottom: 16px;
      }
      .mb-lg {
        margin-bottom: 24px;
      }
    `
  ]
})
export class AdminUserManagementComponent {
  private userService = inject(UserService);
  private notifyService = inject(NotifyService);

  users = signal<User[]>([]);
  loading = signal<boolean>(false);
  searchQuery = '';

  // Store role values per userId so the select can edit without mutating the list object directly.
  roleDrafts: Record<string, string> = {};

  search() {
    this.loading.set(true);
    this.userService.searchUsers(this.searchQuery).subscribe({
      next: (resp) => {
        this.users.set(resp || []);
        // Initialize drafts from current role so select shows correct value.
        const drafts: Record<string, string> = {};
        for (const u of resp || []) {
          drafts[u.id] = u.role;
        }
        this.roleDrafts = drafts;
        this.loading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.loading.set(false);
      }
    });
  }

  roleOptionsFor(u: User): string[] {
    const role = u.role;
    if (role?.startsWith('ROLE_')) {
      return ['ROLE_USER', 'ROLE_ADMIN'];
    }
    return ['USER', 'ADMIN'];
  }

  updateRole(u: User) {
    const role = this.roleDrafts[u.id] ?? u.role;
    this.userService.updateUserRole(u.id, role).subscribe({
      next: (updated) => {
        this.users.set(
          this.users().map(x => (x.id === u.id ? { ...x, role: updated.role ?? role } : x))
        );
        this.notifyService.showSuccess('Role updated', 'User role updated successfully.');
      },
      error: () => this.notifyService.showError('Erreur', 'Impossible de mettre à jour le rôle.')
    });
  }

  deleteUser(u: User) {
    this.notifyService.confirm(
      'Delete this user?',
      'This action cannot be undone.',
      () => {
        this.userService.deleteUser(u.id).subscribe({
          next: () => {
            this.users.set(this.users().filter(x => x.id !== u.id));
            delete this.roleDrafts[u.id];
            this.notifyService.showToast('User deleted', 'success');
          },
          error: () => this.notifyService.showError('Erreur', 'Impossible de supprimer l\'utilisateur.')
        });
      }
    );
  }
}

