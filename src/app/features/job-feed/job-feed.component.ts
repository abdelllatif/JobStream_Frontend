import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil, tap, switchMap } from 'rxjs';
import { JobService, JobFilter } from '../../core/services/job.service';
import { Job } from '../../core/models/job.model';
import { NotifyService } from '../../core/services/notify.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      
      <!-- Search Header -->
      <div class="mb-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <h2 class="text-3xl font-black text-slate-900 mb-2">Trouvez votre prochain emploi</h2>
        <p class="text-slate-500 mb-6 font-medium">Des milliers d'opportunités vous attendent.</p>
        
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Keyword -->
          <div class="relative flex-1">
            <input 
              type="text" 
              [formControl]="searchControl" 
              placeholder="Poste, entreprise ou mots-clés..." 
              class="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 font-medium transition-all shadow-inner"
            >
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
          
          <!-- Location -->
          <div class="relative flex-1 md:max-w-xs">
            <input 
              type="text" 
              [formControl]="locationControl" 
              placeholder="Ville ou région..." 
              class="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 font-medium transition-all shadow-inner"
            >
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
          </div>
          
          <!-- Job Type Dropdown -->
          <div class="md:max-w-[150px]">
            <select [formControl]="typeControl" class="w-full py-4 px-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 font-medium transition-all shadow-inner text-slate-700 appearance-none">
              <option value="">Tous les types</option>
              <option value="FULL_TIME">Temps plein</option>
              <option value="PART_TIME">Temps partiel</option>
              <option value="CONTRACT">Contrat</option>
              <option value="INTERNSHIP">Stage</option>
              <option value="REMOTE">Télétravail</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Job List -->
      <div class="space-y-4">
        @if (loading()) {
          @for (n of [1,2,3,4]; track $index) {
            <div class="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse flex flex-col md:flex-row gap-6">
              <div class="w-16 h-16 bg-slate-100 rounded-xl shrink-0"></div>
              <div class="flex-1 space-y-3">
                <div class="h-5 bg-slate-100 rounded w-1/3"></div>
                <div class="h-4 bg-slate-100 rounded w-1/4"></div>
                <div class="h-3 bg-slate-100 rounded w-3/4 mt-4"></div>
                <div class="h-3 bg-slate-100 rounded w-2/3"></div>
              </div>
              <div class="w-24 h-10 bg-slate-100 rounded-lg shrink-0 mt-4 md:mt-0"></div>
            </div>
          }
        } @else {
          <div class="text-sm font-bold text-slate-500 mb-4 px-2 uppercase tracking-widest">{{ jobs().length }} Offres trouvées</div>
          
          @for (job of jobs(); track job.id) {
            <div class="group bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 transition-all hover:shadow-lg hover:border-primary-200 relative cursor-pointer"
                 (click)="viewJobDetails(job.id)">
              
              <!-- Company Logo -->
              <div class="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                <img *ngIf="job.companyLogo" [src]="job.companyLogo" [alt]="job.companyName" class="w-full h-full object-contain p-2">
                <span *ngIf="!job.companyLogo" class="font-black text-2xl text-slate-300">{{ job.companyName.charAt(0) }}</span>
              </div>

              <!-- Details -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                  <h3 class="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{{ job.title }}</h3>
                  <button class="text-slate-300 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2" (click)="saveJob($event, job)">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                  </button>
                </div>
                
                <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600 mb-3 font-medium">
                  <span class="text-secondary-600">{{ job.companyName }}</span>
                  <span class="text-slate-300">•</span>
                  <span class="flex items-center"><svg class="w-4 h-4 mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> {{ job.location }}</span>
                  <span class="text-slate-300">•</span>
                  <span class="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">{{ formatJobType(job.type) }}</span>
                </div>

                <p class="text-sm text-slate-500 line-clamp-2 mt-2 leading-relaxed">{{ job.description }}</p>

                <div class="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-50 text-xs font-bold text-slate-400">
                  <span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> {{ job.createdAt | date:'mediumDate' }}</span>
                  <span *ngIf="job.applicantsCount" class="flex items-center text-primary-500 bg-primary-50 px-2 py-1 rounded-md"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg> {{ job.applicantsCount }} candidats</span>
                </div>
              </div>
              
              <!-- Quick Action -->
              <div class="flex flex-col justify-center shrink-0 mt-4 md:mt-0">
                <button class="px-6 py-2.5 bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white font-bold rounded-xl transition-colors shadow-sm"
                        (click)="applyJob($event, job)">
                  Postuler
                </button>
              </div>
              
            </div>
          } @empty {
            <div class="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
              <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2">Aucune offre trouvée</h3>
              <p class="text-slate-500 max-w-sm">Désolé, aucune offre ne correspond à vos critères de recherche. Essayez de modifier vos filtres.</p>
              <button class="mt-6 font-bold text-primary-600 hover:text-primary-700" (click)="clearFilters()">Effacer les filtres</button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: []
})
export class JobFeedComponent implements OnInit, OnDestroy {
  private jobService = inject(JobService);
  private notifyService = inject(NotifyService);
  private router = inject(Router);
  
  jobs = signal<Job[]>([]);
  loading = signal<boolean>(true);
  
  searchControl = new FormControl('');
  locationControl = new FormControl('');
  typeControl = new FormControl('');
  
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.searchJobs();

    // Listen to changes on all controls
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.searchJobs());

    this.locationControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.searchJobs());

    this.typeControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.searchJobs());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  searchJobs() {
    this.loading.set(true);
    const filter: JobFilter = {
      keyword: this.searchControl.value || undefined,
      location: this.locationControl.value || undefined,
      jobType: this.typeControl.value || undefined,
      status: 'OPEN' // Only show open jobs in the feed
    };

    this.jobService.searchJobs(filter).subscribe({
      next: (resp) => {
        // Backend typically returns a PageResponse with a generic content array
        // We ensure we only extract the content regardless of specific Pagination
        this.jobs.set(resp.content || resp || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifyService.showError('Erreur', 'Impossible de charger les offres d\'emploi.');
      }
    });
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.locationControl.setValue('');
    this.typeControl.setValue('');
  }

  viewJobDetails(jobId: string) {
    // Navigating to a specific job detail page, if implemented map it correctly
    this.router.navigate(['/jobs', jobId]);
  }

  saveJob(event: Event, job: Job) {
    event.stopPropagation();
    this.notifyService.showToast('Offre sauvegardée', 'success');
  }

  applyJob(event: Event, job: Job) {
    event.stopPropagation();
    this.notifyService.confirm(
      'Postuler à ' + job.companyName, 
      'Votre profil sera envoyé au recruteur.', 
      () => {
        this.notifyService.showToast('Candidature envoyée avec succès!', 'success');
      }
    );
  }

  formatJobType(type: string): string {
    const map: any = {
      'FULL_TIME': 'CDI',
      'PART_TIME': 'Temps partiel',
      'CONTRACT': 'CDD / Contrat',
      'INTERNSHIP': 'Stage',
      'REMOTE': 'Télétravail'
    };
    return map[type] || type;
  }
}
