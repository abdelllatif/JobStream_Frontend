export interface Experience {
  id: string;
  userId: string;
  companyId?: string;
  companyName?: string;
  title: string;
  employmentType?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
