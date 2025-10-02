import type { UserProfile } from '@/api/generated/client';

export interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
