import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  role?: string;
  is_verified?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (): Promise<void> => {
    // Check both potential storage keys for backwards compatibility
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      let data: any = null;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok && data) {
        setUser(data);
      } else {
        // Invalid or expired token
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to authenticate token:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (accessToken: string): Promise<void> => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("token", accessToken);
    setLoading(true);
    await fetchCurrentUser();
  };

  const logout = (): void => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (updatedData: Partial<User>): void => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, fetchCurrentUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};