import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CandidateProfile } from '../models/candidate-profile.model';

@Injectable({ providedIn: 'root' })
export class CandidateProfileService {
  private http = inject(HttpClient);

  getMyProfile(): Observable<CandidateProfile> {
    return this.http.get<CandidateProfile>('/api/profiles/me');
  }

  getProfileByUserId(userId: string): Observable<CandidateProfile> {
    return this.http.get<CandidateProfile>(`/api/profiles/${userId}`);
  }

  updateProfile(profile: Partial<CandidateProfile>): Observable<CandidateProfile> {
    return this.http.put<CandidateProfile>('/api/profiles', profile);
  }

  uploadPhoto(file: File): Observable<CandidateProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CandidateProfile>('/api/profiles/photo', formData);
  }

  uploadCV(file: File): Observable<CandidateProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CandidateProfile>('/api/profiles/cv', formData);
  }
}
