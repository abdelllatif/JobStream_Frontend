import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page">
      <!-- Navbar -->
      <nav class="landing-nav">
        <div class="navbar-container flex-row items-center justify-between">
          <div class="logo">Job<span>Stream</span></div>
          <div class="nav-links flex-row gap-lg">
            <a href="#hero">Home</a>
            <a href="#about">About</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </div>
          <div class="nav-auth flex-row gap-md">
            <a routerLink="/login" class="btn btn-outline">Login</a>
            <a routerLink="/register" class="btn btn-primary">Join Now</a>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section id="hero" class="hero-section">
        <div class="container">
          <div class="hero-content">
            <h1>Find your next <span>professional</span> adventure with JobStream</h1>
            <p>Connect with industry leaders, discover exclusive opportunities, and build your professional legacy.</p>
            <div class="hero-actions flex-row gap-md">
              <a routerLink="/register" class="btn btn-primary btn-lg">Get Started</a>
              <a href="#about" class="btn btn-outline btn-lg">Learn More</a>
            </div>
          </div>
          <div class="hero-image">
             <!-- Placeholder for a premium illustration -->
             <div class="glass-card">
                <div class="shimmer-line skeleton"></div>
                <div class="shimmer-line skeleton" style="width: 80%"></div>
                <div class="shimmer-circle skeleton"></div>
             </div>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section id="about" class="about-section">
        <div class="container text-center">
          <h2 class="section-title">Why JobStream?</h2>
          <div class="benefits-grid">
            <div class="benefit-card card">
              <span class="material-symbols-outlined icon">verified</span>
              <h3>Verified Opportunities</h3>
              <p>Every job posting is vetted to ensure a safe and professional environment.</p>
            </div>
            <div class="benefit-card card">
              <span class="material-symbols-outlined icon">hub</span>
              <h3>Powerful Networking</h3>
              <p>Connect directly with recruiters and peers in your field.</p>
            </div>
            <div class="benefit-card card">
              <span class="material-symbols-outlined icon">bolt</span>
              <h3>Real-time Updates</h3>
              <p>Instant notifications for messages, applications, and network activities.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section">
        <div class="container">
          <h2 class="section-title text-center">Frequently Asked Questions</h2>
          <div class="faq-list">
            <details class="faq-item card">
              <summary>Is JobStream free to use?</summary>
              <p>Yes, JobStream is free for job seekers. Recruiters have access to premium features for job management.</p>
            </details>
            <details class="faq-item card">
              <summary>How does the Google Login work?</summary>
              <p>You can instantly sign up or log in using your Google account. We prioritize your security and only access basic profile information.</p>
            </details>
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section id="contact" class="contact-section">
        <div class="container text-center">
          <h2 class="section-title">Ready to jump in?</h2>
          <p class="mb-md">Join thousands of professionals already growing their careers.</p>
          <a routerLink="/register" class="btn btn-primary btn-lg">Create My Account</a>
        </div>
      </section>

      <footer class="footer">
        <div class="container">
          <p>&copy; 2026 JobStream. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      scroll-behavior: smooth;
    }

    .landing-nav {
      height: 72px;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 1000;
      border-bottom: 1px solid hsl(var(--border) / 0.5);
    }

    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: hsl(var(--primary));
    }

    .logo span {
      color: hsl(var(--text-main));
    }

    .navbar-container {
      width: 100%;
      padding: 0 40px;
    }

    .nav-links a {
      font-weight: 510;
      color: hsl(var(--text-muted));
      font-size: 16px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
    }

    .nav-links a:hover {
      background: hsl(var(--primary) / 0.05);
      color: hsl(var(--primary));
    }

    .hero-section {
      padding: 100px 0;
      background: radial-gradient(circle at top right, hsl(var(--primary) / 0.05), transparent);
      overflow: hidden;
    }

    .hero-section .container {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .hero-content h1 {
      font-size: 56px;
      line-height: 1.1;
      margin-bottom: var(--spacing-lg);
    }

    .hero-content h1 span {
      color: hsl(var(--primary));
    }

    .hero-content p {
      font-size: 20px;
      color: hsl(var(--text-muted));
      margin-bottom: var(--spacing-xl);
    }

    .btn-lg {
      padding: 16px 40px;
      font-size: 18px;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: var(--radius-lg);
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
      width: 400px;
      height: 300px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .shimmer-line { height: 12px; }
    .shimmer-circle { width: 40px; height: 40px; border-radius: 50%; }

    .section-title {
      font-size: 36px;
      margin-bottom: 48px;
    }

    .about-section, .faq-section, .contact-section {
      padding: 100px 0;
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg);
    }

    .benefit-card {
      padding: var(--spacing-xl);
      text-align: center;
    }

    .benefit-card .icon {
      font-size: 48px;
      color: hsl(var(--primary));
      margin-bottom: var(--spacing-md);
    }

    .faq-list {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .faq-item summary {
      font-weight: 600;
      cursor: pointer;
      list-style: none;
    }

    .faq-item p {
      margin-top: var(--spacing-md);
      color: hsl(var(--text-muted));
    }

    .footer {
      padding: 48px 0;
      border-top: 1px solid hsl(var(--border));
      text-align: center;
      color: hsl(var(--text-muted));
    }

    @media (max-width: 968px) {
      .hero-section .container {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .hero-content h1 { font-size: 40px; }
      .hero-image { display: none; }
      .nav-links { display: none; }
    }
  `]
})
export class HomeComponent {}
