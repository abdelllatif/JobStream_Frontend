import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CompanyService, Company } from '../../core/services/company.service';
import { JobService } from '../../core/services/job.service';
import { ApplicationService, Application } from '../../core/services/application.service';
import { RecruiterStatsService, RecruiterStats } from '../../core/services/recruiter-stats.service';
import { AuthService } from '../../core/services/auth.service';
import { NotifyService } from '../../core/services/notify.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Job } from '../../core/models/job.model';

@Component({
  selector: 'app-recruitment-space',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recruitment-space.component.html',
  styleUrls: ['./recruitment-space.component.css']
})
export class RecruitmentSpaceComponent implements OnInit {
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private jobService = inject(JobService);
  private applicationService = inject(ApplicationService);
  private recruiterStatsService = inject(RecruiterStatsService);
  private authService = inject(AuthService);
  private notifyService = inject(NotifyService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  noCompany = signal(false);
  company = signal<Company | null>(null);
  companyId = signal('');
  jobs = signal<Job[]>([]);
  allApplications = signal<Application[]>([]);
  recruiterStats = signal<RecruiterStats | null>(null);
  activeTab = signal<'jobs' | 'applications' | 'stats'>('jobs');

  showJobModal = signal(false);
  editingJob = signal<Job | null>(null);
  submittingJob = signal(false);

  selectedJobForApps = signal<Job | null>(null);
  jobApplications = signal<Application[]>([]);
  jobApplicationsLoading = signal(false);

  jobForm = this.fb.group({
    title: ['', Validators.required],
    jobType: ['', Validators.required],
    location: ['', Validators.required],
    salaryMin: [''],
    salaryMax: [''],
    description: ['', Validators.required],
    status: ['OPEN']
  });

  statsData = computed(() => {
    const rs = this.recruiterStats();
    const jobsList = this.jobs();
    const apps = this.allApplications();
    return {
      totalJobs: rs?.totalJobs ?? jobsList.length,
      activeJobs: rs?.openJobs ?? jobsList.filter(j => j.status === 'OPEN').length,
      totalApplications: rs?.totalApplications ?? apps.length,
      pendingApplications: rs?.pendingApplications ?? apps.filter(a => a.status === 'PENDING').length,
      acceptedApplications: rs?.acceptedApplications ?? apps.filter(a => a.status === 'ACCEPTED').length
    };
  });

  ngOnInit() {
    this.loadCompanyAndData();
  }

  loadCompanyAndData() {
    this.loading.set(true);
    this.companyService.getMyCompanies().subscribe({
      next: (companies) => {
        if (!companies || companies.length === 0) {
          this.noCompany.set(true);
          this.loading.set(false);
          return;
        }
        const myCompany = companies[0];
        this.company.set(myCompany);
        this.companyId.set(myCompany.id);
        this.loadJobs();
        this.loadRecruiterStats();
      },
      error: (err) => {
        console.error('Error loading companies:', err);
        this.notifyService.showError('Error', 'Failed to load your company data.');
        this.noCompany.set(true);
        this.loading.set(false);
      }
    });
  }

  loadRecruiterStats() {
    this.recruiterStatsService.getRecruiterStats(this.companyId()).subscribe({
      next: (stats) => this.recruiterStats.set(stats),
      error: () => {
      }
    });
  }

  loadJobs() {
    this.jobService.getJobsByCompany(this.companyId()).subscribe({
      next: (jobs) => {
        this.jobs.set(jobs || []);
        this.loadAllApplications();
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.notifyService.showToast('Failed to load job postings', 'error');
        this.loading.set(false);
      }
    });
  }

  loadAllApplications() {
    const jobIds = this.jobs().map(j => j.id);
    if (jobIds.length === 0) {
      this.allApplications.set([]);
      this.loading.set(false);
      return;
    }

    let completed = 0;
    let allApps: Application[] = [];
    for (const jobId of jobIds) {
      this.applicationService.getApplicationsForJob(jobId).subscribe({
        next: (apps) => {
          allApps = [...allApps, ...(apps || [])];
          completed++;
          if (completed === jobIds.length) {
            this.allApplications.set(allApps);
            this.loading.set(false);
          }
        },
        error: () => {
          completed++;
          if (completed === jobIds.length) {
            this.allApplications.set(allApps);
            this.loading.set(false);
          }
        }
      });
    }
  }

  openJobModal() {
    this.editingJob.set(null);
    this.jobForm.reset({ status: 'OPEN', jobType: '' });
    this.showJobModal.set(true);
  }

  openEditJobModal(job: Job) {
    this.editingJob.set(job);
    this.jobForm.patchValue({
      title: job.title,
      jobType: job.jobType,
      location: job.location,
      salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
      salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
      description: job.description,
      status: job.status
    });
    this.showJobModal.set(true);
  }

  closeJobModal() {
    this.showJobModal.set(false);
    this.editingJob.set(null);
  }

  submitJob() {
    if (this.jobForm.invalid) return;

    this.submittingJob.set(true);
    const v = this.jobForm.value;
    const payload: any = {
      title: v.title,
      description: v.description,
      location: v.location,
      jobType: v.jobType,
      salaryMin: v.salaryMin ? Number(v.salaryMin) : undefined,
      salaryMax: v.salaryMax ? Number(v.salaryMax) : undefined,
      status: v.status || 'OPEN',
      companyId: this.companyId()
    };

    const editing = this.editingJob();
    const request$ = editing
      ? this.jobService.updateJob(editing.id, payload)
      : this.jobService.createJob(payload);

    request$.subscribe({
      next: () => {
        this.submittingJob.set(false);
        this.closeJobModal();
        this.notifyService.showToast(editing ? 'Offer updated successfully' : 'Offer published successfully', 'success');
        this.loadJobs();
        this.loadRecruiterStats();
      },
      error: (err) => {
        console.error('Error saving job:', err);
        this.submittingJob.set(false);
        this.notifyService.showError('Error', editing ? 'Failed to update the offer.' : 'Failed to publish the offer.');
      }
    });
  }

  deleteJob(job: Job) {
    this.notifyService.confirm(
      'Delete this offer?',
      `"${job.title}" will be permanently removed.`,
      () => {
        this.jobService.deleteJob(job.id).subscribe({
          next: () => {
            this.jobs.set(this.jobs().filter(j => j.id !== job.id));
            this.notifyService.showToast('Offer deleted', 'success');
            this.loadRecruiterStats();
          },
          error: (err) => {
            console.error('Error deleting job:', err);
            this.notifyService.showError('Error', 'Failed to delete the offer.');
          }
        });
      }
    );
  }

  viewApplicationsForJob(job: Job) {
    this.selectedJobForApps.set(job);
    this.jobApplicationsLoading.set(true);
    this.applicationService.getApplicationsForJob(job.id).subscribe({
      next: (apps) => {
        this.jobApplications.set(apps || []);
        this.jobApplicationsLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading applications:', err);
        this.jobApplications.set([]);
        this.jobApplicationsLoading.set(false);
        this.notifyService.showToast('Failed to load applications', 'error');
      }
    });
  }

  closeApplicationsDrawer() {
    this.selectedJobForApps.set(null);
    this.jobApplications.set([]);
  }

  onApplicationStatusChange(applicationId: string, event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value as any;
    this.applicationService.updateApplicationStatus(applicationId, { status: newStatus }).subscribe({
      next: () => {
        this.notifyService.showToast('Application status updated', 'success');
        this.loadAllApplications();
        const selectedJob = this.selectedJobForApps();
        if (selectedJob) {
          this.viewApplicationsForJob(selectedJob);
        }
      },
      error: (err) => {
        console.error('Error updating application status:', err);
        this.notifyService.showError('Error', 'Failed to update application status.');
      }
    });
  }

  viewCandidateProfile(userId?: string) {
    if (userId) {
      this.router.navigate(['/profile', userId]);
    }
  }

  goBack() {
    this.router.navigate(['/job-feed']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatJobType(type: string): string {
    return (type || '').replace(/_/g, ' ');
  }
}
