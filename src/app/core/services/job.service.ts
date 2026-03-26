import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job } from '../models/job.model';

export interface JobFilter {
  keyword?: string;
  location?: string;
  jobType?: string;
  status?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class JobService {
  private http = inject(HttpClient);

  searchJobs(filters: JobFilter): Observable<any> {
    let params = new HttpParams();
    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (filters.location) params = params.set('location', filters.location);
    if (filters.jobType) params = params.set('jobType', filters.jobType);
    if (filters.status) params = params.set('status', filters.status);
    params = params.set('page', (filters.page || 0).toString());
    params = params.set('size', (filters.size || 20).toString());

    return this.http.get<any>('/api/jobs', { params });
  }

  getJobById(id: string): Observable<Job> {
    return this.http.get<Job>(`/api/jobs/${id}`);
  }

  getJobsByCompany(companyId: string): Observable<Job[]> {
    return this.http.get<Job[]>(`/api/jobs/company/${companyId}`);
  }

  // Admin/Company endpoints
  createJob(jobData: Partial<Job>): Observable<Job> {
    return this.http.post<Job>('/api/jobs', jobData);
  }

  updateJob(id: string, jobData: Partial<Job>): Observable<Job> {
    return this.http.put<Job>(`/api/jobs/${id}`, jobData);
  }

  deleteJob(id: string): Observable<void> {
    return this.http.delete<void>(`/api/jobs/${id}`);
  }
}
