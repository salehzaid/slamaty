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
const USE_DIRECT_ADMIN_LOGIN = true; // استخدام تسجيل دخول مباشر بدون API

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔧 AuthProvider: Component initialized');
  
  // Direct admin user for immediate login
  const defaultAdminUser: User = {
    id: 1,
    username: 'test_admin',
    email: 'testadmin@salamaty.com',
    first_name: 'مدير',
    last_name: 'النظام',
    role: 'super_admin',
    department: 'الإدارة العامة',
    position: 'مدير النظام',
    phone: '+966500000000',
    is_active: true,
    created_at: new Date().toISOString()
  };
  
  const [user, setUser] = useState<User | null>(defaultAdminUser);
  const [isLoading, setIsLoading] = useState(false);

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
              // Fallback to direct admin login
              setUser(defaultAdminUser);
              localStorage.setItem('sallamaty_user', JSON.stringify(defaultAdminUser));
              localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s');
              apiClient.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s');
            }
          } catch (error) {
            console.error('❌ API login failed:', error);
            // Fallback to direct admin login
            setUser(defaultAdminUser);
            localStorage.setItem('sallamaty_user', JSON.stringify(defaultAdminUser));
            localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s');
            apiClient.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s');
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
              // Fallback to direct admin login
              setUser(defaultAdminUser);
              localStorage.setItem('sallamaty_user', JSON.stringify(defaultAdminUser));
              localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s');
              apiClient.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s');
            }
          } catch (error) {
            console.error('❌ API login failed:', error);
            // Fallback to direct admin login
            setUser(defaultAdminUser);
            localStorage.setItem('sallamaty_user', JSON.stringify(defaultAdminUser));
            localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s');
            apiClient.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s');
          }
        }
      } else if (!AUTO_LOGIN_ENABLED) {
        setUser(null);
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

  const loginAsAdmin = () => {
    const defaultAdminUser: User = {
      id: 1,
      username: 'test_admin',
      email: 'testadmin@salamaty.com',
      first_name: 'مدير',
      last_name: 'النظام',
      role: 'super_admin',
      department: 'الإدارة العامة',
      position: 'مدير النظام',
      phone: '+966500000000',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    const defaultToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0YWRtaW5Ac2FsYW1hdHkuY29tIiwiZXhwIjoxNzU5NjQ3OTgwfQ.y-0JLyzewqHc3DBAdgUHTsAXVrdeHDms16jNf5O-l3s';
    
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
