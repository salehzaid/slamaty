import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsAdmin: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No mock users - all data comes from database

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('sallamaty_user');
    const storedToken = localStorage.getItem('access_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        apiClient.setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('sallamaty_user');
        localStorage.removeItem('access_token');
      }
    } else {
      // لا يوجد مستخدم مسجل دخول - عرض صفحة تسجيل الدخول
      setUser(null);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.access_token) {
        // تحويل استجابة API إلى تنسيق User
        const user: User = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          role: response.user.role,
          department: response.user.department,
          position: response.user.position,
          phone: response.user.phone,
          is_active: response.user.is_active,
          created_at: response.user.created_at
        };
        
        setUser(user);
        localStorage.setItem('sallamaty_user', JSON.stringify(user));
        localStorage.setItem('access_token', response.access_token);
        apiClient.setToken(response.access_token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const loginAsAdmin = () => {
    const defaultAdminUser: User = {
      id: 1,
      username: 'admin',
      email: 'admin@salamaty.com',
      first_name: 'مدير',
      last_name: 'النظام',
      role: 'admin',
      department: 'الإدارة العامة',
      position: 'مدير النظام',
      phone: '+966500000000',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    const defaultToken = 'admin-direct-access-token';
    
    setUser(defaultAdminUser);
    localStorage.setItem('sallamaty_user', JSON.stringify(defaultAdminUser));
    localStorage.setItem('access_token', defaultToken);
    apiClient.setToken(defaultToken);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sallamaty_user');
    localStorage.removeItem('access_token');
    apiClient.clearToken();
  };

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    return user ? requiredRoles.includes(user.role) : false;
  };

  const value = {
    user,
    login,
    loginAsAdmin,
    logout,
    isAuthenticated: !!user,
    isLoading,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};