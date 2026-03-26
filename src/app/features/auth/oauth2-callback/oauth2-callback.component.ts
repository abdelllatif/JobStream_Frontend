import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  template: `
    <div class="callback-container card">
      <div class="spinner skeleton"></div>
      <p>Completing authentication...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      max-width: 400px;
      margin: 100px auto;
      text-align: center;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
  `]
})
export class OAuth2CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');

    if (token && refreshToken) {
      this.authService.handleOAuth2Callback(token, refreshToken);
    }
  }
}
