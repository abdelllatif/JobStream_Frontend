import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="logo">Job<span>Stream</span></div>
          <h1>Welcome Back</h1>
          <p>Don't miss your next opportunity. Log in to your professional communities.</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" formControlName="email" placeholder="Enter your email">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" formControlName="password" placeholder="Enter your password">
          </div>
          
          <button type="submit" class="btn btn-primary btn-full" [disabled]="loginForm.invalid || loading()">
            {{ loading() ? 'Logging in...' : 'Sign in' }}
          </button>
        </form>

        <div class="divider">
          <span>or</span>
        </div>

        <button class="btn btn-outline btn-full btn-google" (click)="loginWithGoogle()">
          <img src="https://lh3.googleusercontent.com/COxitqgJr1sICpeqSUPVLunPWHnC9S8GuGvF0SOfW9Y05SgxDko4Wz-9_p0uY2-uX_W3oZ-TwpfA0X0zG1tXGq-5=" alt="Google" width="18">
          Continue with Google
        </button>

        <p class="auth-footer">
          New to JobStream? <a routerLink="/register">Join now</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: hsl(var(--bg-main));
      padding: var(--spacing-md);
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: var(--spacing-xl);
    }
    .auth-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: hsl(var(--primary));
      margin-bottom: var(--spacing-md);
    }
    .logo span { color: hsl(var(--text-main)); }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .auth-header p { color: hsl(var(--text-muted)); font-size: 14px; }
    
    .auth-form { display: flex; flex-direction: column; gap: var(--spacing-md); }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 14px; font-weight: 500; color: hsl(var(--text-muted)); }
    input {
      padding: 10px 12px;
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius-sm);
      font-family: inherit;
    }
    input:focus {
      outline: none;
      border-color: hsl(var(--primary));
      box-shadow: 0 0 0 2px hsl(var(--primary) / 0.1);
    }
    .btn-full { width: 100%; margin-top: 8px; }
    .divider {
      text-align: center;
      margin: 24px 0;
      position: relative;
    }
    .divider::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: hsl(var(--border));
    }
    .divider span {
      position: relative;
      background: hsl(var(--bg-card));
      padding: 0 12px;
      color: hsl(var(--text-muted));
      font-size: 14px;
    }
    .btn-google { display: flex; gap: 12px; }
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: hsl(var(--text-muted));
    }
    .auth-footer a { color: hsl(var(--primary)); font-weight: 600; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  
  loading = () => false; // Placeholder

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe();
    }
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:8081/api/auth/google';
  }
}
