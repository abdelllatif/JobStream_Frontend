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
  template: `
    <div class="max-w-2xl mx-auto px-4 py-10">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h1 class="text-3xl font-black text-slate-900 mb-2">Create Company</h1>
        <p class="text-slate-500 mb-8 font-medium">
          Fill your company details. After creation, you can later upload the logo and manage employees.
        </p>

        <form (ngSubmit)="createCompany()" class="space-y-5">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
            <input
              type="text"
              name="name"
              [(ngModel)]="draft.name"
              required
              class="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea
              name="description"
              [(ngModel)]="draft.description"
              rows="4"
              class="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Website</label>
              <input
                type="text"
                name="website"
                [(ngModel)]="draft.website"
                class="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
              <input
                type="text"
                name="location"
                [(ngModel)]="draft.location"
                class="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Industry</label>
              <input
                type="text"
                name="industry"
                [(ngModel)]="draft.industry"
                class="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Size</label>
              <input
                type="text"
                name="size"
                [(ngModel)]="draft.size"
                class="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>
          </div>

          <div class="flex gap-3 flex-wrap pt-2">
            <button
              type="submit"
              [disabled]="loading() || !draft.name.trim()"
              class="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all"
            >
              {{ loading() ? 'Creating...' : 'Create Company' }}
            </button>
            <button
              type="button"
              (click)="router.navigate(['/job-feed'])"
              class="px-6 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
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
    industry: undefined,
    size: undefined
  };

  createCompany() {
    if (!this.draft.name.trim()) return;

    this.loading.set(true);
    this.companyService.createCompany(this.draft).subscribe({
      next: (company) => {
        this.loading.set(false);
        this.notifyService.showToast(`Company created: ${company.name}`, 'success');
        // Keep user on the page; they can create/update later (logo/employees).
      },
      error: () => {
        this.loading.set(false);
        this.notifyService.showError('Erreur', 'Impossible de créer la société.');
      }
    });
  }
}

