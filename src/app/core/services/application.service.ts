import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Application {
  id: string;
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  userId: string;
  userEmail?: string;
  userHeadline?: string;
  userPhotoUrl?: string;
  cvUrl?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  coverLetter?: string;
  appliedAt: string;
  updatedAt?: string;
}

export interface CreateApplicationRequest {
  jobId: string;
  cvUrl?: string;
  coverLetter?: string;
}

export interface UpdateApplicationStatusRequest {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);

  applyToJob(data: CreateApplicationRequest): Observable<Application> {
    return this.http.post<Application>('/api/applications', data);
  }

  getMyApplications(): Observable<any> {
    return this.http.get<any>('/api/applications/my');
  }

  getApplicationsForJob(jobId: string): Observable<Application[]> {
    return this.http.get<Application[]>(`/api/applications/job/${jobId}`);
  }

  updateApplicationStatus(applicationId: string, status: UpdateApplicationStatusRequest): Observable<Application> {
    return this.http.put<Application>(`/api/applications/${applicationId}/status`, status);
  }

  withdrawApplication(applicationId: string): Observable<void> {
    return this.http.delete<void>(`/api/applications/${applicationId}`);
  }
}
