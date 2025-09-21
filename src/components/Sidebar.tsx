import React from 'react';
import { 
  Home, 
  Users, 
  ClipboardCheck, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Building2,
  FileText,
  LogOut,
  Shield,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavItem, Badge } from '../types';
import LanguageSwitcher from './LanguageSwitcher';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout, hasPermission } = useAuth();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: 'Home',
      path: 'dashboard',
      roles: ['super_admin', 'quality_manager', 'department_head', 'assessor', 'viewer']
    },
    {
      id: 'rounds',
      label: 'إدارة الجولات',
      icon: 'ClipboardCheck',
      path: 'rounds',
      roles: ['super_admin', 'quality_manager', 'department_head', 'assessor'],
      badge: { type: 'number', value: 5, color: 'blue' }
    },
    {
      id: 'my-rounds',
      label: 'جولاتي',
      icon: 'Calendar',
      path: 'my-rounds',
      roles: ['assessor', 'department_head'],
      badge: { type: 'new', value: 'جديد', color: 'green' }
    },
    {
      id: 'capa',
      label: 'الخطط التصحيحية',
      icon: 'AlertTriangle',
      path: 'capa',
      roles: ['super_admin', 'quality_manager', 'department_head'],
      badge: { type: 'number', value: 3, color: 'red' }
    },
    {
      id: 'reports',
      label: 'التقارير والتحليلات',
      icon: 'BarChart3',
      path: 'reports',
      roles: ['super_admin', 'quality_manager', 'department_head', 'viewer']
    },
    {
      id: 'departments',
      label: 'الأقسام',
      icon: 'Building2',
      path: 'departments',
      roles: ['super_admin', 'quality_manager'],
      badge: { type: 'featured', value: 'مميز', color: 'purple' }
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      icon: 'Users',
      path: 'users',
      roles: ['super_admin', 'quality_manager']
    },
    {
      id: 'templates',
      label: 'قوالب التقييم',
      icon: 'FileText',
      path: 'templates',
      roles: ['super_admin', 'quality_manager'],
      badge: { type: 'text', value: 'محدث', color: 'orange' }
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: 'Settings',
      path: 'settings',
      roles: ['super_admin', 'quality_manager']
    }
  ];

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      Home,
      Users,
      ClipboardCheck,
      AlertTriangle,
      BarChart3,
      Settings,
      Building2,
      FileText,
      Calendar,
      CheckCircle2
    };
    return icons[iconName] || Home;
  };

  const getBadgeStyles = (badge: Badge) => {
    const baseStyles = "text-xs px-2 py-1 rounded-full font-medium";
    
    const colorStyles = {
      red: "bg-red-500 text-white",
      blue: "bg-blue-500 text-white", 
      green: "bg-green-500 text-white",
      yellow: "bg-yellow-500 text-black",
      purple: "bg-purple-500 text-white",
      orange: "bg-orange-500 text-white"
    };

    const typeStyles = {
      number: "min-w-[20px] h-5 flex items-center justify-center",
      text: "px-2 py-1",
      new: "px-2 py-1 animate-pulse",
      featured: "px-2 py-1 font-bold"
    };

    return `${baseStyles} ${colorStyles[badge.color || 'blue']} ${typeStyles[badge.type]}`;
  };

  const renderBadge = (badge: Badge) => {
    return (
      <span className={getBadgeStyles(badge)}>
        {badge.value}
      </span>
    );
  };

  const filteredNavItems = navItems.filter(item => hasPermission(item.roles));

  return (
    <div className="bg-slate-800 text-white h-screen w-72 flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">نظام سلامتي</h1>
            <p className="text-slate-400 text-sm">إدارة الجودة وسلامة المرضى</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 bg-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-slate-400 text-xs truncate">{user?.department}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = getIcon(item.icon);
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200
                ${isActive 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium flex-1">{item.label}</span>
              {item.badge && (
                <div className="mr-auto">
                  {renderBadge(item.badge)}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Language Switcher */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center justify-center mb-3">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;