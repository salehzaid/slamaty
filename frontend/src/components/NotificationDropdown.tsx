import React, { useState } from 'react'
import { Bell, Check, Trash2, RefreshCw, X } from 'lucide-react'
import { useNotifications } from '@/context/NotificationsContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface NotificationDropdownProps {
  className?: string
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    refreshNotifications 
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'round_assigned':
        return '🎯'
      case 'round_reminder':
        return '⏰'
      case 'round_deadline':
        return '⚠️'
      case 'capa_assigned':
        return '📋'
      case 'capa_deadline':
        return '🚨'
      case 'system_update':
        return '🔄'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'round_assigned':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'round_reminder':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'round_deadline':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'capa_assigned':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'capa_deadline':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'system_update':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleRemoveNotification = async (id: number) => {
    await removeNotification(id)
  }

  const handleRefresh = async () => {
    await refreshNotifications()
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    الإشعارات
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="mr-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading}
                    >
                      <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="w-full"
                  >
                    <Check className="w-4 h-4 ml-2" />
                    تحديد الكل كمقروء
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    جاري التحميل...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    لا توجد إشعارات
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                          getNotificationColor(notification.type),
                          !notification.unread && "opacity-75"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={cn(
                                "text-sm font-medium truncate",
                                notification.unread && "font-semibold"
                              )}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 ml-2">
                                {notification.unread && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveNotification(notification.id)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {notification.time}
                              </span>
                              {notification.is_email_sent && (
                                <span className="text-xs text-green-600">
                                  📧 تم الإرسال
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationDropdown
