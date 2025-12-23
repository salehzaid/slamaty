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
          // Parse stored user and set token first
          const userData = JSON.parse(storedUser);
          apiClient.setToken(storedToken);
          // Validate token by fetching current user from API
          try {
            const current = await apiClient.getCurrentUser();
            // Normalize response: some backends return { user: { ... } }
            const validatedUser = current?.user || current || userData;
            setUser(validatedUser);
            localStorage.setItem('sallamaty_user', JSON.stringify(validatedUser));
            setIsLoading(false);
            console.log('✅ Token validated and user set from API');
            return;
          } catch (validationError) {
            console.warn('⚠️ Stored token invalid or expired, clearing stored auth', validationError);
            localStorage.removeItem('sallamaty_user');
            localStorage.removeItem('access_token');
            apiClient.clearToken();
            // continue to allow manual login flow
          }
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
      console.log('🔐 Attempting login for:', email);
      const response = await apiClient.login(email, password);
      
      console.log('📥 AuthContext received response:', {
        hasResponse: !!response,
        hasAccessToken: !!response?.access_token,
        hasUser: !!response?.user,
        responseKeys: response ? Object.keys(response) : []
      });
      
      if (response && response.access_token) {
        // Extract user data from response
        const userData = response.user || response;
        
        console.log('👤 User data extracted:', {
          id: userData?.id,
          email: userData?.email,
          username: userData?.username,
          role: userData?.role
        });
        
        if (!userData || !userData.email) {
          console.error('❌ Invalid user data in response:', userData);
          return false;
        }
        
        const user: User = {
          id: userData.id,
          username: userData.username || userData.email,
          email: userData.email,
          first_name: userData.first_name || userData.firstName || '',
          last_name: userData.last_name || userData.lastName || '',
          role: userData.role,
          department: userData.department || '',
          position: userData.position || '',
          phone: userData.phone || '',
          is_active: userData.is_active !== false,
          created_at: userData.created_at
        };
        
        setUser(user);
        localStorage.setItem('sallamaty_user', JSON.stringify(user));
        localStorage.setItem('access_token', response.access_token);
        apiClient.setToken(response.access_token);
        console.log('✅ Login successful for user:', user.email);
        return true;
      }
      
      console.error('❌ Login failed: No access token in response. Response:', response);
      return false;
    } catch (error: any) {
      console.error('❌ Login error in AuthContext:', error);
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        // Re-throw to let LoginPage handle it
        throw error;
      }
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

export const useAuth = (): AuthContextType | null => {
  const context = useContext(AuthContext);
  // If used outside provider, return null instead of throwing so callers can handle gracefully
  if (context === undefined) {
    console.warn('useAuth called outside of AuthProvider - returning null');
    return null;
  }
  return context;
};
