import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Company {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  location?: string;
  domain?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  employeeCount?: number;
}

export interface CompanyEmployee {
  id: string;
  userId: string;
  userEmail?: string;
  userHeadline?: string;
  userPhotoUrl?: string;
  companyId: string;
  companyName?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhoto?: string;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  website?: string;
  location?: string;
  domain?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient);

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

  searchCompanies(query: string): Observable<any> {
    return this.http.get<any>(`/api/companies/search?query=${encodeURIComponent(query)}`);
  }

  getMyCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>('/api/companies/my');
  }

  uploadLogo(companyId: string, file: File): Observable<Company> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Company>(`/api/companies/${companyId}/logo`, formData);
  }

  getEmployees(companyId: string): Observable<CompanyEmployee[]> {
    return this.http.get<CompanyEmployee[]>(`/api/companies/${companyId}/employees`);
  }

  addEmployee(companyId: string, userId: string, startDate?: string): Observable<CompanyEmployee> {
    return this.http.post<CompanyEmployee>(`/api/companies/${companyId}/employees`, { userId, startDate });
  }

  removeEmployee(companyId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`/api/companies/${companyId}/employees/${memberId}`);
  }
}
