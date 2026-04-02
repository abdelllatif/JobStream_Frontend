import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { JobService, JobFilter } from '../../core/services/job.service';
import { ApplicationService } from '../../core/services/application.service';
import { Job } from '../../core/models/job.model';
import { NotifyService } from '../../core/services/notify.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './job-feed.component.html',
  styleUrls: ['./job-feed.component.css']
})
export class JobFeedComponent implements OnInit, OnDestroy {
  private jobService = inject(JobService);
  private applicationService = inject(ApplicationService);
  private notifyService = inject(NotifyService);
  private router = inject(Router);

  private allJobs = signal<Job[]>([]);
  jobs = signal<Job[]>([]);
  loading = signal<boolean>(true);
  appliedJobIds = signal<Set<string>>(new Set());
  selectedJob = signal<Job | null>(null);

  searchControl = new FormControl('');
  locationControl = new FormControl('');
  typeControl = new FormControl('');

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadAllJobs();
    this.loadMyApplications();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());

    this.locationControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());

    this.typeControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllJobs() {
    this.loading.set(true);
    this.jobService.getJobsExceptPoster({ size: 200 }).subscribe({
      next: (resp) => {
        const jobs = resp.content || resp || [];
        this.allJobs.set(jobs);
        this.jobs.set(jobs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifyService.showError('Erreur', 'Impossible de charger les offres d\'emploi.');
      }
    });
  }

  private applyFilters() {
    const keyword = (this.searchControl.value || '').toLowerCase().trim();
    const location = (this.locationControl.value || '').toLowerCase().trim();
    const jobType = this.typeControl.value || '';

    let filtered = this.allJobs();

    if (keyword) {
      filtered = filtered.filter(j =>
        (j.title || '').toLowerCase().includes(keyword) ||
        (j.companyName || '').toLowerCase().includes(keyword) ||
        (j.description || '').toLowerCase().includes(keyword)
      );
    }

    if (location) {
      filtered = filtered.filter(j =>
        (j.location || '').toLowerCase().includes(location)
      );
    }

    if (jobType) {
      filtered = filtered.filter(j => j.jobType === jobType);
    }

    this.jobs.set(filtered);
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.locationControl.setValue('');
    this.typeControl.setValue('');
    this.jobs.set(this.allJobs());
  }

  loadMyApplications() {
    this.applicationService.getMyApplications().subscribe({
      next: (resp) => {
        const apps = resp.content || resp || [];
        const ids = new Set<string>(apps.map((a: any) => a.jobId));
        this.appliedJobIds.set(ids);
      },
      error: () => {}
    });
  }

  hasApplied(jobId: string): boolean {
    return this.appliedJobIds().has(jobId);
  }

  viewJobDetails(jobId: string) {
    const job = this.jobs().find(j => j.id === jobId);
    if (job) this.selectedJob.set(job);
  }

  closeJobDetail() {
    this.selectedJob.set(null);
  }

  goToCompany(companyId: string) {
    if (!companyId) return;
    this.closeJobDetail();
    this.router.navigate(['/company', companyId]);
  }

  saveJob(event: Event, job: Job) {
    event.stopPropagation();
    this.notifyService.showToast('Offre sauvegardée', 'success');
  }

  applyJob(event: Event, job: Job) {
    event.stopPropagation();
    if (this.hasApplied(job.id)) return;
    this.notifyService.confirm(
      'Postuler à ' + job.companyName,
      'Votre profil sera envoyé au recruteur.',
      () => {
        this.applicationService.applyToJob({ jobId: job.id }).subscribe({
          next: () => {
            this.appliedJobIds.update(ids => new Set([...ids, job.id]));
            this.jobs.update(jobs => jobs.map(j =>
              j.id === job.id ? { ...j, applicationCount: (j.applicationCount || 0) + 1 } : j
            ));
            this.allJobs.update(jobs => jobs.map(j =>
              j.id === job.id ? { ...j, applicationCount: (j.applicationCount || 0) + 1 } : j
            ));
            if (this.selectedJob()?.id === job.id) {
              this.selectedJob.update(j => j ? { ...j, applicationCount: (j.applicationCount || 0) + 1 } : j);
            }
            this.notifyService.showToast('Candidature envoyée avec succès!', 'success');
          },
          error: (err) => {
            const msg = err?.error?.message || 'Impossible d\'envoyer votre candidature.';
            this.notifyService.showError('Erreur', msg);
          }
        });
      }
    );
  }

  formatJobType(type: string): string {
    const map: any = {
      'FULL_TIME': 'CDI',
      'PART_TIME': 'Temps partiel',
      'CONTRACT': 'CDD / Contrat',
      'INTERNSHIP': 'Stage'
    };
    return map[type] || type;
  }
}
