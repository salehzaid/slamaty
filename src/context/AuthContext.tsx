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

// 🔧 إعدادات تسجيل الدخول التلقائي
const AUTO_LOGIN_ENABLED = true; // تسجيل الدخول التلقائي مُفعّل
const AUTO_LOGIN_EMAIL = 'admin@salamaty.com';
const AUTO_LOGIN_PASSWORD = '123456';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for stored authentication
      const storedUser = localStorage.getItem('sallamaty_user');
      const storedToken = localStorage.getItem('access_token');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          apiClient.setToken(storedToken);
          setIsLoading(false);
          console.log('✅ User already logged in from storage');
          return;
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('sallamaty_user');
          localStorage.removeItem('access_token');
        }
      }
      
      // 🚀 تسجيل الدخول التلقائي إذا لم يكن هناك مستخدم مسجل
      if (AUTO_LOGIN_ENABLED && !storedUser) {
        console.log('🔄 Auto-login: Attempting to login automatically...');
        try {
          const response = await apiClient.login(AUTO_LOGIN_EMAIL, AUTO_LOGIN_PASSWORD);
          
          if (response.access_token) {
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
            console.log('✅ Auto-login successful!');
          } else {
            console.error('❌ Auto-login failed: No access token');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Auto-login failed:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };

    initializeAuth();
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
