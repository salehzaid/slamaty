import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  BellRing, 
  X, 
  Settings,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  Target,
  Calendar
} from 'lucide-react'
import { apiClient } from '@/lib/api'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'capa' | 'round' | 'system' | 'deadline' | 'escalation'
  action_required: boolean
  data?: {
    capa_id?: number
    round_id?: number
    user_id?: number
    deadline?: string
  }
}

interface RealTimeNotificationsProps {
  userId?: number
  autoConnect?: boolean
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  userId,
  autoConnect = true
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio for notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification-sound.mp3')
      audioRef.current.preload = 'auto'
    }
  }, [])

  // WebSocket connection
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionStatus('connecting')
    
    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws/notifications/${userId || 'anonymous'}`
        : `ws://localhost:8000/ws/notifications/${userId || 'anonymous'}`
      
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleNotification(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setConnectionStatus('disconnected')
        
        // Auto-reconnect after 3 seconds
        if (autoConnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      setConnectionStatus('error')
    }
  }

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }

  const handleNotification = (data: any) => {
    const notification: Notification = {
      id: data.id || Date.now().toString(),
      type: data.type || 'info',
      title: data.title || 'إشعار جديد',
      message: data.message || '',
      timestamp: new Date(data.timestamp || Date.now()),
      read: false,
      priority: data.priority || 'medium',
      category: data.category || 'system',
      action_required: data.action_required || false,
      data: data.data
    }

    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Play sound if enabled
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.log('Could not play notification sound:', error)
      })
    }

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      })
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.request(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiClient.request('/api/notifications/mark-all-read', {
        method: 'PUT'
      })

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.request(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      'info': Info,
      'warning': AlertTriangle,
      'error': AlertTriangle,
      'success': CheckCircle
    }
    return icons[type as keyof typeof icons] || Bell
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'critical') {
      return 'border-red-200 bg-red-50'
    } else if (priority === 'high') {
      return 'border-orange-200 bg-orange-50'
    } else if (type === 'error') {
      return 'border-red-200 bg-red-50'
    } else if (type === 'warning') {
      return 'border-yellow-200 bg-yellow-50'
    } else if (type === 'success') {
      return 'border-green-200 bg-green-50'
    } else {
      return 'border-blue-200 bg-blue-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityText = (priority: string) => {
    const texts = {
      'low': 'منخفض',
      'medium': 'متوسط',
      'high': 'عالي',
      'critical': 'حرج'
    }
    return texts[priority as keyof typeof texts] || priority
  }

  const getCategoryText = (category: string) => {
    const texts = {
      'capa': 'خطة تصحيحية',
      'round': 'جولة',
      'system': 'نظام',
      'deadline': 'موعد نهائي',
      'escalation': 'تصعيد'
    }
    return texts[category as keyof typeof texts] || category
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) {
      return 'الآن'
    } else if (diffMinutes < 60) {
      return `منذ ${diffMinutes} دقيقة`
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`
    } else {
      return `منذ ${diffDays} يوم`
    }
  }

  // Initialize connection
  useEffect(() => {
    if (autoConnect) {
      connectWebSocket()
    }

    // Request notification permission
    requestNotificationPermission()

    return () => {
      disconnectWebSocket()
    }
  }, [autoConnect, userId])

  return (
    <div className="relative">
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative flex items-center gap-2"
        >
          {isConnected ? (
            <BellRing className="w-5 h-5 text-green-600" />
          ) : (
            <Bell className="w-5 h-5 text-gray-600" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Connection Status */}
        <div className="absolute -bottom-6 left-0 text-xs">
          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1 text-green-600">
              <Wifi className="w-3 h-3" />
              <span>متصل</span>
            </div>
          )}
          {connectionStatus === 'connecting' && (
            <div className="flex items-center gap-1 text-yellow-600">
              <Clock className="w-3 h-3" />
              <span>جاري الاتصال...</span>
            </div>
          )}
          {connectionStatus === 'disconnected' && (
            <div className="flex items-center gap-1 text-gray-600">
              <WifiOff className="w-3 h-3" />
              <span>غير متصل</span>
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center gap-1 text-red-600">
              <WifiOff className="w-3 h-3" />
              <span>خطأ في الاتصال</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Panel */}
      {isExpanded && (
        <div className="absolute top-12 right-0 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">الإشعارات</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className="p-1"
                >
                  {isSoundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    تعيين الكل كمقروء
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  const colorClass = getNotificationColor(notification.type, notification.priority)
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 ${colorClass} ${!notification.read ? 'bg-opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.type === 'error' ? 'bg-red-100 text-red-600' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          notification.type === 'success' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </h4>
                                <Badge className={getPriorityColor(notification.priority)}>
                                  {getPriorityText(notification.priority)}
                                </Badge>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{getCategoryText(notification.category)}</span>
                                <span>•</span>
                                <span>{getRelativeTime(notification.timestamp)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {isConnected ? 'متصل بالخادم' : 'غير متصل'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={isConnected ? disconnectWebSocket : connectWebSocket}
                className="text-xs"
              >
                {isConnected ? 'قطع الاتصال' : 'إعادة الاتصال'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealTimeNotifications
