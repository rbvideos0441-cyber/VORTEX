export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bannerURL?: string;
  username: string;
  bio: string;
  website?: string;
  pronouns?: string;
  location?: string;
  followersCount: number;
  followingCount: number;
  isPremium: boolean;
  isVerified: boolean;
  badges: string[];
  coins: number;
  interests: string[];
  onboardingCompleted: boolean;
  role?: 'admin' | 'user';
  createdAt: any;
}

export interface Video {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  musicName: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: any;
  tags: string[];
}

export interface LiveParticipant {
  uid: string;
  username: string;
  photoURL: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking?: boolean;
}

export interface LiveMessage {
  id: string;
  uid: string;
  username: string;
  text: string;
  type: 'chat' | 'gift' | 'system';
  giftValue?: number;
}

export interface LiveStream {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
  title: string;
  viewerCount: number;
  coinCount: number;
  likesCount?: number;
  isLive: boolean;
  type: 'video' | 'audio';
  startedAt: any;
  activeSlotCount: number;
  participants: LiveParticipant[];
  blockedUids?: string[];
  goal?: {
    current: number;
    target: number;
    label: string;
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
