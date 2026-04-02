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
  templateUrl: './admin-profile-management.component.html',
  styleUrls: ['./admin-profile-management.component.css']
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

