import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileService {
  private http = inject(HttpClient);

  uploadProfilePicture(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('/api/files/profile-picture', formData, { responseType: 'text' });
  }

  uploadCV(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('/api/files/cv', formData, { responseType: 'text' });
  }
}
