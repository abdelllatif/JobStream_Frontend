import { CandidateProfile } from './candidate-profile.model';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  provider?: string;
  enabled?: boolean;
  createdAt?: string;
  photoUrl?: string;
  headline?: string;
  profile?: CandidateProfile;
}

export interface AuthResponse extends User {
  accessToken: string;
  refreshToken: string;
}
