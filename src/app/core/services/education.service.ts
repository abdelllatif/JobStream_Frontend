import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Education } from '../models/education.model';

@Injectable({ providedIn: 'root' })
export class EducationService {
  private http = inject(HttpClient);

  getMyEducations(): Observable<Education[]> {
    return this.http.get<Education[]>('/api/educations/me');
  }

  getEducationsByUserId(userId: string): Observable<Education[]> {
    return this.http.get<Education[]>(`/api/educations/user/${userId}`);
  }

  createEducation(edu: any): Observable<Education> {
    return this.http.post<Education>('/api/educations', edu);
  }

  updateEducation(id: number, edu: any): Observable<Education> {
    return this.http.put<Education>(`/api/educations/${id}`, edu);
  }

  deleteEducation(id: number): Observable<void> {
    return this.http.delete<void>(`/api/educations/${id}`);
  }
}
