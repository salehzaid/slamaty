import React from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/context/NotificationsContext'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  className?: string
  onClick?: () => void
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className, onClick }) => {
  const { unreadCount } = useNotifications()

  if (unreadCount === 0) return null

  return (
    <div className={cn("relative", className)}>
      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    </div>
  )
}

export default NotificationBadge
