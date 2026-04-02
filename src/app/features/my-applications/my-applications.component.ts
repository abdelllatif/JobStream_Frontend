import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Application, ApplicationService } from '../../core/services/application.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.css']
})
export class MyApplicationsComponent implements OnInit {
  private applicationService = inject(ApplicationService);

  applications = signal<Application[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    this.applicationService.getMyApplications().subscribe({
      next: (resp) => {
        const apps = Array.isArray(resp) ? resp : (resp?.content || []);
        this.applications.set(apps);
        this.loading.set(false);
      },
      error: () => {
        this.applications.set([]);
        this.loading.set(false);
      }
    });
  }

  getJobTitle(app: any): string {
    return app.jobTitle || app.job?.title || 'Offre non disponible';
  }

  getCompanyName(app: any): string {
    return app.companyName || app.job?.companyName || 'Entreprise non specifiee';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      ACCEPTED: 'Acceptee',
      REJECTED: 'Refusee'
    };
    return labels[status] || status;
  }
}
