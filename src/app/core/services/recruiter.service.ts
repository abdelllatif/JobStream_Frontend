import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecruiterStats {
  totalJobsPosted: number;
  totalApplications: number;
  openPositions: number;
  closedPositions: number;
  applicationsByJob?: { jobTitle: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class RecruiterService {
  private http = inject(HttpClient);

  getCompanyStats(companyId: string): Observable<RecruiterStats> {
    return this.http.get<RecruiterStats>(`/api/recruiter/stats/company/${companyId}`);
  }
}
