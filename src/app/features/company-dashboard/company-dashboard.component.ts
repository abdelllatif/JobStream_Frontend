import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CompanyService } from '../../core/services/company.service';
import { JobService } from '../../core/services/job.service';
import { RecruiterStatsService, RecruiterStats } from '../../core/services/recruiter-stats.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './company-dashboard.component.html',
  styleUrls: ['./company-dashboard.component.css']
})
export class CompanyDashboardComponent implements OnInit {
  private companyService = inject(CompanyService);
  private jobService = inject(JobService);
  private statsService = inject(RecruiterStatsService);
  private notifyService = inject(NotifyService);
  private router = inject(Router);

  companies = signal<any[]>([]);
  jobs = signal<any[]>([]);
  stats = signal<any>({
    activeJobs: 0,
    totalApplicants: 0,
    pendingApplications: 0
  });

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.companyService.getMyCompanies().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        if (companies.length > 0) {
          this.loadJobsForCompanies(companies);
          this.loadStats(companies[0].id);
        }
      },
      error: () => {
        this.notifyService.showToast('Failed to load companies', 'error');
      }
    });
  }

  loadJobsForCompanies(companies: any[]) {
    const companyId = companies[0].id;
    this.jobService.getJobsByCompany(companyId).subscribe({
      next: (data) => {
        this.jobs.set(data || []);
      },
      error: () => {
        this.notifyService.showToast('Failed to load jobs', 'error');
      }
    });
  }

  loadStats(companyId: string) {
    this.statsService.getRecruiterStats(companyId).subscribe({
      next: (data: RecruiterStats) => {
        this.stats.set({
          activeJobs: data.openJobs || 0,
          totalApplicants: data.totalApplications || 0,
          pendingApplications: data.pendingApplications || 0
        });
      },
      error: () => {}
    });
  }

  goToRecruitmentSpace(companyId: string) {
    this.router.navigate(['/recruitment', companyId]);
  }
}
