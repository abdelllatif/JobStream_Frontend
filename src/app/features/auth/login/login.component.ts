import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SuspensionService } from '../../../core/services/suspension.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private suspensionService = inject(SuspensionService);
  
  loading = signal(false);
  errorMessage = signal('');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');
      const email = this.loginForm.get('email')?.value || '';
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (user) => {
          const isAdmin = user.role === 'ROLE_ADMIN' || user.role === 'ADMIN';
          this.router.navigate([isAdmin ? '/admin' : '/job-feed']);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          
          if (error.status === 403) {
            const message = error?.error?.message || 
              'Vous etes suspendu. Les admins ont vu quelque chose de suspect. Votre activite et vos applications sont encore actives. Veuillez attendre maximum 1 jour pour retirer la suspension.';
            
            this.suspensionService.setSuspension(message, email);
            this.router.navigate(['/account-suspended']);
          } 
          else if (error.status === 401) {
            this.errorMessage.set(error?.error?.message || 'Email ou mot de passe incorrect.');
          }
          else {
            this.errorMessage.set(error?.error?.message || 'Une erreur est survenue. Veuillez réessayer.');
          }
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:8081/api/auth/google';
  }
}
