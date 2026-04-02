export interface Job {
  id: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  status: 'OPEN' | 'CLOSED';
  salaryMin?: number;
  salaryMax?: number;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  applicationCount?: number;
}
