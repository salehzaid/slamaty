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

// 🔧 إعدادات تسجيل الدخول التلقائي (اختياري)
// لتفعيلها: ضع VITE_AUTO_LOGIN=1 في بيئة Vite
const AUTO_LOGIN_ENABLED = import.meta.env.VITE_AUTO_LOGIN === '1';
// Use direct API login flag (keeps behavior explicit)
const USE_DIRECT_ADMIN_LOGIN = false;

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

      // If there is no stored session and auto-login is disabled, do NOT block the UI.
      if (!storedUser || !storedToken) {
        if (!AUTO_LOGIN_ENABLED) {
          setIsLoading(false);
          console.log('✅ AuthContext: No stored session; showing login (no auto-login).');
          return;
        }
      }

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
          } catch (validationError: any) {
            console.warn('⚠️ Token validation failed:', validationError);

            // Only clear storage if explicitly unauthorized (401)
            // If it's a network error (backend down), keep the session for offline/demo mode
            const isUnauthorized = validationError.message?.includes('Authentication required') ||
              validationError.status === 401;

            if (isUnauthorized) {
              console.warn('🔒 Token expired or invalid, clearing session');
              localStorage.removeItem('sallamaty_user');
              localStorage.removeItem('access_token');
              apiClient.clearToken();
            } else {
              console.log('📡 Network error during validation, keeping unverified session');
              setUser(userData);
              setIsLoading(false);
            }
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
              // Use simple test account created by setup scripts
              body: JSON.stringify({
                email: 'testqm@local',
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
            const response = await apiClient.login('testqm@local', 'test123');

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
      // If backend is unavailable in DEV, fallback to demo user automatically
      if (typeof window !== 'undefined' && (window as any).__API_UNAVAILABLE__ && import.meta.env.DEV) {
        console.warn('⚠️ Backend unavailable — using demo fallback user for login (DEV)')
        const demoUser: User = {
          id: 999,
          username: 'demo',
          email: 'demo@local',
          first_name: 'مستخدم',
          last_name: 'تجريبي',
          role: 'quality_manager',
          department: '',
          position: '',
          phone: '',
          is_active: true,
          created_at: new Date().toISOString()
        }
        setUser(demoUser)
        try { localStorage.setItem('sallamaty_user', JSON.stringify(demoUser)); localStorage.setItem('access_token', 'demo-token'); apiClient.setToken('demo-token') } catch { }
        return true
      }
      // Log detailed error information and re-throw so UI can show message
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
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
