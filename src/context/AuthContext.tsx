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
const AUTO_LOGIN_ENABLED = false; // إيقاف تسجيل الدخول التلقائي
const USE_DIRECT_ADMIN_LOGIN = false; // إيقاف تسجيل الدخول المباشر

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔧 AuthProvider: Component initialized');
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 AuthContext: Starting authentication initialization...');
      // Check for stored authentication
      const storedUser = localStorage.getItem('sallamaty_user');
      const storedToken = localStorage.getItem('access_token');
      console.log('🔍 AuthContext: Stored user exists:', !!storedUser);
      
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
      
      // �� تسجيل الدخول التلقائي
      console.log('🔄 AuthContext: AUTO_LOGIN_ENABLED:', AUTO_LOGIN_ENABLED, 'storedUser:', !!storedUser);
      if (AUTO_LOGIN_ENABLED && !storedUser) {
        if (USE_DIRECT_ADMIN_LOGIN) {
          // 🔄 تسجيل دخول عبر API للحصول على JWT صحيح
          console.log('🔄 Auto-login: Attempting to login via API...');
          try {
            const response = await fetch('http://localhost:8000/api/auth/signin', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: 'testadmin@salamaty.com',
                password: 'test123'
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('✅ API login successful!', data);
              
              const user: User = {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                role: data.user.role,
                department: data.user.department,
                position: data.user.position,
                phone: data.user.phone,
                is_active: data.user.is_active,
                created_at: data.user.created_at
              };
              
              setUser(user);
              localStorage.setItem('sallamaty_user', JSON.stringify(user));
              localStorage.setItem('access_token', data.access_token);
              apiClient.setToken(data.access_token);
              console.log('👤 User set:', user.email);
            } else {
              console.error('❌ API login failed:', response.status);
              // Don't use expired token - require real login
              console.log('⚠️ Skipping expired token fallback - user must login');
            }
          } catch (error) {
            console.error('❌ API login failed:', error);
            // Don't use expired token - require real login
            console.log('⚠️ Skipping expired token fallback - user must login');
          }
        } else {
          // 🔄 تسجيل دخول عبر API (أبطأ)
          console.log('🔄 Auto-login: Attempting to login via API...');
          try {
            const response = await apiClient.login('testadmin@salamaty.com', 'test123');
            
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
              console.log('✅ API login successful!');
            } else {
              console.error('❌ API login failed: No access token');
              // Don't use expired token - require real login
              console.log('⚠️ Skipping expired token fallback - user must login');
            }
          } catch (error) {
            console.error('❌ API login failed:', error);
            // Don't use expired token - require real login
            console.log('⚠️ Skipping expired token fallback - user must login');
          }
        }
      }
      
      setIsLoading(false);
      console.log('🏁 AuthContext: Authentication initialization completed');
    };

    console.log('🎯 AuthContext: Calling initializeAuth...');
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password);
      
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
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const loginAsAdmin = async () => {
    // Use real API login instead of expired token
    console.log('🔄 loginAsAdmin: Using real API login...');
    try {
      const success = await login('testadmin@salamaty.com', 'test123');
      if (!success) {
        console.error('❌ Admin login failed');
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
    }
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
