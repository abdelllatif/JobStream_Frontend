import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JobApplicationStats {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
}

export interface RecruiterStats {
  companyId: string;
  companyName: string;
  totalJobs: number;
  openJobs: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  jobStats?: JobApplicationStats[];
}

@Injectable({ providedIn: 'root' })
export class RecruiterStatsService {
  private http = inject(HttpClient);

  getRecruiterStats(companyId: string): Observable<RecruiterStats> {
    return this.http.get<RecruiterStats>(`/api/recruiter/stats/company/${companyId}`);
  }
}
