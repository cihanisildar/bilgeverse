"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { UserRole } from "@prisma/client";
import { signIn, signOut, useSession } from "next-auth/react";

type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  points?: number;
  avatarUrl?: string;
  tutor?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isBoardMember: boolean;
  isTutor: boolean;
  isStudent: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userUpdatedFromAPI, setUserUpdatedFromAPI] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const isPublicPath = (path: string) => {
    return path === '/' ||
      path === '/login' ||
      path === '/register' ||
      path.startsWith('/_next');
  };

  const checkAuth = async () => {
    try {
      console.log('Checking auth...');
      const res = await fetch("/api/auth/me", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUserUpdatedFromAPI(true); // Mark that user was updated from API

        // Reset the flag after a short delay to allow future session updates
        setTimeout(() => {
          setUserUpdatedFromAPI(false);
        }, 1000);

        return data.user; // Return the fresh user data
      } else {
        setUser(null);
        setUserUpdatedFromAPI(false);
        return null;
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Monitor session changes
  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session) {
      setUser(null);
      setUserUpdatedFromAPI(false);
      setLoading(false);
      return;
    }

    // Only update user state from session if it wasn't recently updated from API
    // and if it's actually different to prevent unnecessary re-renders
    if (session?.user && (!user || user.id !== session.user.id) && !userUpdatedFromAPI) {
      setUser(session.user as AuthUser);
    }

    setLoading(false);
  }, [session?.user?.id, status, user?.id, userUpdatedFromAPI]); // Only depend on user ID and status, not the entire session

  const login = async (username: string, password: string, callbackUrl?: string) => {
    try {
      setLoading(true);
      console.log('Login attempt started for user:', username);

      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        // Show specific error message
        const errorMessage = result.error === 'CredentialsSignin'
          ? 'Kullanıcı adı veya şifre hatalı'
          : result.error === 'Missing credentials'
            ? 'Kullanıcı adı ve şifre gereklidir'
            : result.error === 'Invalid username or password'
              ? 'Kullanıcı adı veya şifre hatalı'
              : result.error;

        console.error('Login error:', errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      if (!result?.ok) {
        console.error('Login failed - result not ok');
        toast.error("Giriş işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.");
        setLoading(false);
        return;
      }

      // Wait for session to be updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show success message
      toast.success('Giriş başarılı!');

      // Redirect to callbackUrl if provided, otherwise to dashboard
      const redirectUrl = callbackUrl || '/dashboard';
      await router.replace(redirectUrl);

    } catch (error) {
      console.error("Login error:", error);
      toast.error("Giriş başarısız. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut({ redirect: false });
      setUser(null);
      router.replace('/login');
      toast.success('Çıkış başarılı!');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Çıkış yapılırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user data...');
      const res = await fetch("/api/auth/refresh", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log('User data refreshed:', data.user);
        setUser(data.user);
        setUserUpdatedFromAPI(true);

        // Reset the flag after a short delay
        setTimeout(() => {
          setUserUpdatedFromAPI(false);
        }, 1000);
      } else {
        console.error('Failed to refresh user data');
      }
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  const isAdmin = user?.role === UserRole.ADMIN;
  const isBoardMember = user?.role === UserRole.BOARD_MEMBER;
  const isTutor = user?.role === UserRole.TUTOR || user?.role === UserRole.ASISTAN;
  const isStudent = user?.role === UserRole.STUDENT;
  const isAuthenticated = Boolean(user && !loading);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        checkAuth,
        refreshUser,
        isAdmin,
        isBoardMember,
        isTutor,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
