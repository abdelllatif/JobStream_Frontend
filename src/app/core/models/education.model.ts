export interface Education {
  id: number;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  candidateProfileId: number;
}
