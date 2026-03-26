import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../../core/models/auth.model';
import { CandidateProfile } from '../../core/models/candidate-profile.model';
import { CandidateProfileService } from '../../core/services/candidate-profile.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-admin-profile-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card p-6 rounded-xl bg-white shadow-sm border border-gray-200">
      <h2 class="text-xl font-black text-slate-900 mb-2">Profile Management</h2>
      <p class="text-slate-600 text-sm mb-lg">
        Enter a userId and preview their profile. Click “Open full profile” to see the full design.
      </p>

      <form class="search-row flex gap-3 mb-md" (ngSubmit)="loadProfile()">
        <input
          type="text"
          name="userId"
          [(ngModel)]="userId"
          placeholder="User ID (UUID)..."
          class="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
        />
        <button
          type="submit"
          class="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all"
        >
          Load
        </button>
      </form>

      <div *ngIf="loading()" class="text-slate-500 text-sm">Loading...</div>

      <div *ngIf="!loading() && user()">
        <div class="profile-preview">
          <div class="banner">
            <div class="pattern-overlay"></div>
          </div>

          <div class="header">
            <div class="avatar-wrap">
              <img
                [src]="profile()?.photoUrl || user()?.photoUrl || 'assets/default-avatar.png'"
                alt="Avatar"
                class="avatar"
              />
            </div>
            <div class="meta">
              <div class="name text-2xl font-black text-slate-900">
                {{ (user()?.firstName || user()?.email || '') + ' ' + (user()?.lastName || '') }}
              </div>
              <div class="headline text-slate-600 font-bold mt-1">
                {{ profile()?.headline || 'Prêt pour de nouvelles opportunités' }}
              </div>
              <div class="sub text-slate-500 text-sm mt-2">
                {{ user()?.email }}
              </div>
            </div>
          </div>

          <div class="grid gap-4 mt-6 grid-cols-1 md:grid-cols-3">
            <div class="box md:col-span-2">
              <div class="box-title">Bio</div>
              <div class="box-body whitespace-pre-wrap text-sm text-slate-700">
                {{ profile()?.bio || '—' }}
              </div>
              <div class="box-title mt-5">Location</div>
              <div class="box-body text-sm text-slate-700">
                {{ profile()?.location || 'Non spécifiée' }}
              </div>
            </div>

            <div class="box">
              <div class="box-title">Links</div>
              <div class="box-body flex flex-col gap-2">
                <a
                  *ngIf="profile()?.linkedinUrl"
                  [href]="profile()?.linkedinUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="link"
                >
                  LinkedIn
                </a>
                <a
                  *ngIf="profile()?.githubUrl"
                  [href]="profile()?.githubUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="link"
                >
                  GitHub
                </a>
                <a
                  [href]="profile()?.portfolioUrl || '#'"
                  [class.opacity-50]="!profile()?.portfolioUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="link"
                >
                  Portfolio
                </a>
              </div>
            </div>
          </div>

          <div class="actions mt-6 flex gap-3 flex-wrap">
            <button type="button" class="open-btn" (click)="openFullProfile()">
              Open full profile
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: white;
      }
      .banner {
        height: 140px;
        background: linear-gradient(to right, rgb(15 23 42), rgb(30 41 59));
        position: relative;
        overflow: hidden;
        border-radius: 16px 16px 0 0;
      }
      .pattern-overlay {
        position: absolute;
        inset: 0;
        opacity: 0.18;
        background-image: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
      }
      .profile-preview {
        border: 1px solid rgba(203, 213, 225, 0.8);
        border-radius: 16px;
        overflow: hidden;
        margin-top: 16px;
      }
      .header {
        display: flex;
        gap: 20px;
        padding: 20px 20px 10px 20px;
        align-items: center;
      }
      .avatar-wrap {
        margin-top: -55px;
        border-radius: 9999px;
        background: white;
        padding: 6px;
        box-shadow: 0 10px 30px rgba(2, 6, 23, 0.15);
      }
      .avatar {
        width: 120px;
        height: 120px;
        border-radius: 9999px;
        object-fit: cover;
      }
      .meta {
        flex: 1;
      }
      .sub {
        font-weight: 600;
      }
      .box {
        background: rgba(248, 250, 252, 1);
        border: 1px solid rgba(226, 232, 240, 1);
        border-radius: 14px;
        padding: 16px;
      }
      .box-title {
        font-size: 12px;
        font-weight: 900;
        color: rgb(100 116 139);
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .box-body {
        margin-top: 8px;
      }
      .link {
        font-weight: 800;
        color: rgb(37 99 235);
        text-decoration: underline;
      }
      .open-btn {
        padding: 10px 16px;
        background: rgb(37 99 235);
        color: white;
        font-weight: 900;
        border-radius: 14px;
      }
    `
  ]
})
export class AdminProfileManagementComponent {
  private userService = inject(UserService);
  private profileService = inject(CandidateProfileService);
  private router = inject(Router);

  userId = '';
  loading = signal(false);

  user = signal<User | null>(null);
  profile = signal<CandidateProfile | null>(null);

  loadProfile() {
    const id = this.userId.trim();
    if (!id) return;

    this.loading.set(true);
    forkJoin({
      user: this.userService.getUserById(id),
      profile: this.profileService.getProfileByUserId(id)
    }).subscribe({
      next: ({ user, profile }) => {
        this.user.set(user);
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.user.set(null);
        this.profile.set(null);
        this.loading.set(false);
      }
    });
  }

  openFullProfile() {
    const id = this.userId.trim();
    if (!id) return;
    this.router.navigate(['/profile', id]);
  }
}

