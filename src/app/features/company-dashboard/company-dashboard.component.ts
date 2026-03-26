import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <div class="header-section flex-row justify-between items-center mb-lg">
        <h1>Company Dashboard</h1>
        <button class="btn btn-primary">
          <span class="material-symbols-outlined">add</span>
          Post a New Job
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid mb-lg">
        <div class="stat-card card text-center">
          <span class="stat-value">{{stats().activeJobs}}</span>
          <span class="stat-label">Active Jobs</span>
        </div>
        <div class="stat-card card text-center">
          <span class="stat-value">{{stats().totalApplicants}}</span>
          <span class="stat-label">Total Applicants</span>
        </div>
        <div class="stat-card card text-center">
          <span class="stat-value">{{stats().interviewsScheduled}}</span>
          <span class="stat-label">Interviews</span>
        </div>
      </div>

      <!-- Jobs Management -->
      <div class="jobs-management card">
        <h2 class="mb-md">Your Posted Jobs</h2>
        <div class="table-responsive">
          <table class="jobs-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Posted On</th>
                <th>Applicants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (job of jobs(); track job.id) {
                <tr>
                  <td class="job-title-cell">{{job.title}}</td>
                  <td>{{job.createdAt | date:'shortDate'}}</td>
                  <td>
                    <span class="applicant-badge">{{job.applicantsCount}} Applied</span>
                  </td>
                  <td>
                    <span class="status-pill" [class.active]="job.active">
                      {{job.active ? 'Active' : 'Draft'}}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon">
                      <span class="material-symbols-outlined">visibility</span>
                    </button>
                    <button class="btn-icon">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn-icon">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center p-xl">No jobs posted yet.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: var(--spacing-lg);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-lg);
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      padding: 32px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: hsl(var(--primary));
      font-family: 'Outfit', sans-serif;
    }

    .stat-label {
      font-size: 14px;
      color: hsl(var(--text-muted));
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 8px;
    }

    .jobs-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .jobs-table th {
      padding: 16px;
      font-size: 14px;
      color: hsl(var(--text-muted));
      border-bottom: 2px solid hsl(var(--border) / 0.5);
    }

    .jobs-table td {
      padding: 16px;
      border-bottom: 1px solid hsl(var(--border) / 0.5);
      font-size: 14px;
    }

    .job-title-cell { font-weight: 600; }

    .applicant-badge {
      background: hsl(var(--primary) / 0.1);
      color: hsl(var(--primary));
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pill {
      background: hsl(var(--text-muted) / 0.1);
      color: hsl(var(--text-muted));
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pill.active {
      background: hsl(var(--success) / 0.1);
      color: hsl(var(--success));
    }

    .actions-cell {
      display: flex;
      gap: 12px;
    }

    .btn-icon {
      color: hsl(var(--text-muted));
      padding: 6px;
      border-radius: 50%;
    }

    .btn-icon:hover {
      background: hsl(var(--secondary));
      color: hsl(var(--primary));
    }

    @media (max-width: 768px) {
      .jobs-table th:nth-child(2),
      .jobs-table td:nth-child(2) { display: none; }
    }
  `]
})
export class CompanyDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  
  jobs = signal<any[]>([]);
  stats = signal<any>({
    activeJobs: 0,
    totalApplicants: 0,
    interviewsScheduled: 0
  });

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.http.get<any[]>('/api/jobs/my').subscribe(data => {
      this.jobs.set(data);
      this.stats.set({
        activeJobs: data.filter(j => j.active).length,
        totalApplicants: data.reduce((acc, j) => acc + (j.applicantsCount || 0), 0),
        interviewsScheduled: 0
      });
    });
  }
}
