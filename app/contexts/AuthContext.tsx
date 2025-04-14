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

type AuthUser = {
  id: string;
  username: string;
  email: string;
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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAdmin: boolean;
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

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isPublicPath = (path: string) => {
    return path === '/' || 
           path === '/login' || 
           path === '/register' || 
           path.startsWith('/_next');
  };

  const refreshToken = async () => {
    try {
      console.log('Attempting to refresh token...');
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      console.log('Refresh token response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Token refresh successful, new user:', data.user);
        setUser(data.user);
        return true;
      }
      console.log('Token refresh failed');
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  };

  const checkAuth = async () => {
    const currentPath = window.location.pathname;
    console.log('Checking auth for path:', currentPath);
    
    if (isPublicPath(currentPath)) {
      console.log('Path is public, skipping auth check');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching /api/auth/me...');
      const res = await fetch("/api/auth/me", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      console.log('Auth check response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Auth check successful, user:', data.user);
        setUser(data.user);
        setLoading(false);
        return;
      } else if (res.status === 401) {
        console.log('Auth check failed (401), attempting token refresh...');
        const refreshed = await refreshToken();
        console.log('Token refresh result:', refreshed);
        if (!refreshed) {
          console.log('Token refresh failed, clearing user state');
          setUser(null);
          if (!isPublicPath(currentPath)) {
            console.log('Redirecting to login page due to failed refresh');
            router.replace('/login');
          }
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
        console.log('Non-network error, clearing user state');
        setUser(null);
        if (!isPublicPath(currentPath)) {
          console.log('Redirecting to login page due to error');
          router.replace('/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log('Initial path check:', currentPath);
    
    if (!isPublicPath(currentPath)) {
      console.log('Running initial auth check');
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const currentPath = window.location.pathname;
    
    if (user && !isPublicPath(currentPath)) {
      console.log('Setting up periodic auth check');
      interval = setInterval(checkAuth, 4 * 60 * 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user]);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Giriş başarısız. Lütfen tekrar deneyin.");
        return;
      }

      const data = await res.json();
      setUser(data.user);
      
      toast.success('Giriş başarılı!');

      if (data.user.role === UserRole.ADMIN) {
        router.replace("/admin");
      } else if (data.user.role === UserRole.TUTOR) {
        router.replace("/tutor");
      } else {
        router.replace("/student");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Giriş başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === UserRole.ADMIN;
  const isTutor = user?.role === UserRole.TUTOR;
  const isStudent = user?.role === UserRole.STUDENT;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        isAdmin,
        isTutor,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
