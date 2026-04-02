import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyService, CreateCompanyRequest } from '../../core/services/company.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-company-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-create.component.html',
  styleUrls: ['./company-create.component.css']
})
export class CompanyCreateComponent {
  private companyService = inject(CompanyService);
  private notifyService = inject(NotifyService);
  router = inject(Router);

  loading = signal(false);

  draft: CreateCompanyRequest = {
    name: '',
    description: undefined,
    website: undefined,
    location: undefined,
    domain: undefined
  };

  createCompany() {
    if (!this.draft.name.trim()) return;

    this.loading.set(true);
    this.companyService.createCompany(this.draft).subscribe({
      next: (company) => {
        this.loading.set(false);
        this.notifyService.showToast(`Company created: ${company.name}`, 'success');
        this.router.navigate(['/company', company.id]);
      },
      error: () => {
        this.loading.set(false);
        this.notifyService.showError('Erreur', 'Impossible de créer la société.');
      }
    });
  }
}

