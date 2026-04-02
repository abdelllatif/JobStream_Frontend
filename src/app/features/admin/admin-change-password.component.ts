import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-admin-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-change-password.component.html',
  styleUrls: ['./admin-change-password.component.css']
})
export class AdminChangePasswordComponent implements OnInit {
  private userService = inject(UserService);
  private notifyService = inject(NotifyService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  hasPassword = signal(true);
  checkingPassword = signal(true);

  showCurrent = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);

  ngOnInit() {
    this.userService.hasPassword().subscribe({
      next: (has) => {
        this.hasPassword.set(has);
        this.checkingPassword.set(false);
      },
      error: () => {
        this.hasPassword.set(true);
        this.checkingPassword.set(false);
      }
    });
  }

  onSubmit() {
    this.successMsg.set('');
    this.errorMsg.set('');

    if (this.newPassword !== this.confirmPassword) {
      this.errorMsg.set('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMsg.set('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    this.loading.set(true);

    if (this.hasPassword()) {
      this.userService.changePassword(this.currentPassword, this.newPassword, this.confirmPassword).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMsg.set('Mot de passe mis à jour avec succès.');
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMsg.set(err?.error?.message || 'Échec de la mise à jour du mot de passe.');
        }
      });
    } else {
      this.userService.setPassword(this.newPassword, this.confirmPassword).subscribe({
        next: () => {
          this.loading.set(false);
          this.hasPassword.set(true);
          this.successMsg.set('Mot de passe défini avec succès. Vous pouvez maintenant vous connecter par email.');
          this.newPassword = '';
          this.confirmPassword = '';
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMsg.set(err?.error?.message || 'Échec de la définition du mot de passe.');
        }
      });
    }
  }
}
