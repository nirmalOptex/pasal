import { create } from 'zustand';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  businessId: string;
  businessName: string;
  currency: string;
  branchId?: string | null;
  branchName?: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: UserSession | null;
  token: string | null;
  branchId: string | null;
  setAuth: (user: UserSession, token: string, refreshToken?: string) => void;
  setBranchId: (branchId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const savedBranchId = localStorage.getItem('branchId') || savedUser?.branchId || null;

  return {
    user: savedUser,
    token: savedToken,
    branchId: savedBranchId,
    setAuth: (user, token, refreshToken) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (user.branchId) {
        localStorage.setItem('branchId', user.branchId);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      set({ user, token, branchId: user.branchId || null });
    },
    setBranchId: (branchId: string) => {
      localStorage.setItem('branchId', branchId);
      set({ branchId });
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      set({ user: null, token: null, branchId: null });
    },
  };
});
