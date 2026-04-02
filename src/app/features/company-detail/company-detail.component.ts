import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompanyService, Company, CompanyEmployee } from '../../core/services/company.service';
import { JobService } from '../../core/services/job.service';
import { Job } from '../../core/models/job.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './company-detail.component.html',
  styleUrls: ['./company-detail.component.css']
})
export class CompanyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private jobService = inject(JobService);
  private authService = inject(AuthService);

  companyId = signal<string>('');
  company = signal<Company | null>(null);
  employees = signal<CompanyEmployee[]>([]);
  companyJobs = signal<Job[]>([]);
  loading = signal(true);
  jobsLoading = signal(true);
  currentUser = this.authService.currentUser;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyId.set(id);
      this.loadCompanyData();
      this.loadCompanyJobs();
    } else {
      this.router.navigate(['/job-feed']);
    }
  }

  loadCompanyData() {
    this.loading.set(true);
    this.companyService.getCompanyById(this.companyId()).subscribe({
      next: (company) => {
        this.company.set(company);
        this.loadEmployees();
      },
      error: (error) => {
        console.error('Error loading company:', error);
        this.loading.set(false);
      }
    });
  }

  loadEmployees() {
    this.companyService.getEmployees(this.companyId()).subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.loading.set(false);
      }
    });
  }

  loadCompanyJobs() {
    this.jobsLoading.set(true);
    this.jobService.getJobsByCompany(this.companyId()).subscribe({
      next: (jobs) => {
        this.companyJobs.set(jobs || []);
        this.jobsLoading.set(false);
      },
      error: () => {
        this.jobsLoading.set(false);
      }
    });
  }

  isEmployee(): boolean {
    return this.employees().some(emp => emp.userId === this.currentUser()?.id);
  }

  goBack() {
    this.router.navigate(['/job-feed']);
  }

  viewProfile(userId: string) {
    this.router.navigate(['/profile', userId]);
  }

  editCompany() {
    console.log('Edit company functionality not implemented yet');
  }

  formatJobType(type: string): string {
    const map: Record<string, string> = {
      'FULL_TIME': 'Full Time',
      'PART_TIME': 'Part Time',
      'CONTRACT': 'Contract',
      'INTERNSHIP': 'Internship',
      'REMOTE': 'Remote'
    };
    return map[type] || type;
  }
}
