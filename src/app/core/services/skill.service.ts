import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill } from '../models/skill.model';

@Injectable({ providedIn: 'root' })
export class SkillService {
  private http = inject(HttpClient);

  getMySkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>('/api/skills/me');
  }

  getSkillsByUserId(userId: string): Observable<Skill[]> {
    return this.http.get<Skill[]>(`/api/skills/user/${userId}`);
  }

  createSkill(skill: any): Observable<Skill> {
    return this.http.post<Skill>('/api/skills', skill);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`/api/skills/${id}`);
  }
}
