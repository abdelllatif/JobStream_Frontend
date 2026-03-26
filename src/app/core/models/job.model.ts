export interface Job {
  id: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE';
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  requirements: string[];
  salaryRange?: string;
  createdAt: string;
  updatedAt: string;
  applicantsCount?: number;
}
