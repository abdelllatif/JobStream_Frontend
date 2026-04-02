import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Experience } from '../models/experience.model';

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private http = inject(HttpClient);

  getMyExperiences(): Observable<Experience[]> {
    return this.http.get<Experience[]>('/api/experiences/me');
  }

  getExperiencesByUserId(userId: string): Observable<Experience[]> {
    return this.http.get<Experience[]>(`/api/experiences/user/${userId}`);
  }

  createExperience(exp: any): Observable<Experience> {
    return this.http.post<Experience>('/api/experiences', exp);
  }

  updateExperience(id: string, exp: any): Observable<Experience> {
    return this.http.put<Experience>(`/api/experiences/${id}`, exp);
  }

  deleteExperience(id: string): Observable<void> {
    return this.http.delete<void>(`/api/experiences/${id}`);
  }
}
