import { CandidateProfile } from './candidate-profile.model';

export interface Connection {
  id: string;
  senderId: string;
  senderEmail: string;
  senderFirstName?: string;
  senderLastName?: string;
  senderHeadline?: string;
  senderPhotoUrl?: string;
  receiverId: string;
  receiverEmail: string;
  receiverFirstName?: string;
  receiverLastName?: string;
  receiverHeadline?: string;
  receiverPhotoUrl?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

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
  connections?: Connection[];
}

export interface AuthResponse extends User {
  accessToken: string;
  refreshToken: string;
}
