import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SuspensionService } from '../../../core/services/suspension.service';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  templateUrl: './oauth2-callback.component.html',
  styleUrls: ['./oauth2-callback.component.css']
})
export class OAuth2CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private suspensionService = inject(SuspensionService);

  error = signal<string>('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');
    const error = this.route.snapshot.queryParamMap.get('error');
    const message = this.route.snapshot.queryParamMap.get('message');

    if (error === 'suspended') {
      const suspensionMessage = message || 'Votre compte est suspendu temporairement.';
      this.suspensionService.setSuspension(suspensionMessage, '');
      this.router.navigate(['/account-suspended']);
      return;
    }

    if (token && refreshToken) {
      this.authService.handleOAuth2Callback(token, refreshToken);
    } else if (token) {
      this.authService.handleOAuth2Callback(token, token);
    } else {
      this.error.set('Authentication failed. No token received.');
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
