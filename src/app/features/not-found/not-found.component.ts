import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-container">
      <div class="not-found-card">
        <div class="error-code">404</div>
        <h1>Page introuvable</h1>
        <p>La page que vous recherchez n'existe pas ou a ete deplacee.</p>
        <div class="actions">
          <a routerLink="/job-feed" class="btn-primary">Retour au fil d'emplois</a>
          <a routerLink="/home" class="btn-secondary">Page d'accueil</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 2rem;
    }
    .not-found-card {
      text-align: center;
      max-width: 480px;
    }
    .error-code {
      font-size: 8rem;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    p {
      color: #64748b;
      margin-bottom: 2rem;
    }
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: #6366f1;
      color: white;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: #4f46e5; }
    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn-secondary:hover { background: #f1f5f9; }
  `]
})
export class NotFoundComponent {}
