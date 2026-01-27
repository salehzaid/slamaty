import React, { useState, useRef, useEffect } from 'react'
import { 
  LogOut,
  Settings,
  Bell,
  User,
  ChevronDown,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationsContext'
import { useNavigate } from 'react-router-dom'

interface UserDropdownProps {
  onLogout: () => void
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onLogout }) => {
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (notification.unread) {
      markAsRead(notification.id)
    }
    
    // Handle notification click based on type
    if (notification.type === 'round') {
      navigate('/rounds/my-rounds')
    } else if (notification.type === 'deadline') {
      navigate('/rounds')
    }
    setShowNotifications(false)
  }

  const handleSettingsClick = () => {
    navigate('/settings')
    setIsOpen(false)
  }

  const handleLogoutClick = () => {
    onLogout()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Info Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200/50 dark:border-slate-600/50 hover:from-blue-100 hover:to-purple-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 hover:scale-105 shadow-sm"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-sm font-bold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-medium">
            {user?.department || 'غير محدد'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user?.position || user?.role || 'مستخدم'}
          </p>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Notifications Section */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">الإشعارات</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                {showNotifications && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {showNotifications ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors duration-200",
                      notification.unread 
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" 
                        : "bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                        notification.unread ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} إشعار جديد` : 'لا توجد إشعارات جديدة'}
                </p>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Button
              variant="ghost"
              onClick={handleSettingsClick}
              className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-[1.02]"
            >
              <Settings className="w-4 h-4" />
              الإعدادات
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleLogoutClick}
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-[1.02]"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDropdown
