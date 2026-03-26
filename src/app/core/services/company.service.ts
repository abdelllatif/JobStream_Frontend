import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  size?: string;
  logoUrl?: string;
  createdAt?: string;
}

export interface CompanyEmployee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  profilePhoto?: string;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  size?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient);

  // --- Company CRUD ---

  createCompany(data: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>('/api/companies', data);
  }

  getCompanyById(id: string): Observable<Company> {
    return this.http.get<Company>(`/api/companies/${id}`);
  }

  updateCompany(id: string, data: Partial<Company>): Observable<Company> {
    return this.http.put<Company>(`/api/companies/${id}`, data);
  }

  deleteCompany(id: string): Observable<void> {
    return this.http.delete<void>(`/api/companies/${id}`);
  }

  searchCompanies(name: string): Observable<Company[]> {
    return this.http.get<Company[]>(`/api/companies/search?name=${encodeURIComponent(name)}`);
  }

  getMyCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>('/api/companies/my');
  }

  uploadLogo(companyId: string, file: File): Observable<Company> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Company>(`/api/companies/${companyId}/logo`, formData);
  }

  // --- Employee Management ---

  getEmployees(companyId: string): Observable<CompanyEmployee[]> {
    return this.http.get<CompanyEmployee[]>(`/api/companies/${companyId}/employees`);
  }

  addEmployee(companyId: string, userId: string): Observable<any> {
    return this.http.post(`/api/companies/${companyId}/employees`, { userId });
  }

  removeEmployee(companyId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`/api/companies/${companyId}/employees/${memberId}`);
  }
}
