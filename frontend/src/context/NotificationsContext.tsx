import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api'

export interface Notification {
  id: number
  title: string
  message: string
  time: string
  unread: boolean
  type: 'round_assigned' | 'round_reminder' | 'round_deadline' | 'capa_assigned' | 'capa_deadline' | 'system_update' | 'general'
  createdAt: Date
  entity_type?: string
  entity_id?: number
  is_email_sent: boolean
  email_sent_at?: Date
  read_at?: Date
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  removeNotification: (id: number) => void
  clearAllNotifications: () => void
  refreshNotifications: () => Promise<void>
  loadNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}

interface NotificationsProviderProps {
  children: React.ReactNode
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const unreadCount = notifications.filter(n => n.unread).length

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    // Skip loading if user is not authenticated
    if (!apiClient.isAuthenticated()) {
      return
    }
    try {
      setIsLoading(true)
      // use apiClient.get which returns { data } wrapper
      const response = await apiClient.get('/api/notifications')
      const raw = response?.data || response || []
      const apiNotifications = (raw || []).map((notification: any) => ({
        ...notification,
        unread: notification.status === 'unread',
        createdAt: new Date(notification.created_at),
        email_sent_at: notification.email_sent_at ? new Date(notification.email_sent_at) : undefined,
        read_at: notification.read_at ? new Date(notification.read_at) : undefined,
        time: getTimeAgo(new Date(notification.created_at))
      }))
      setNotifications(apiNotifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadNotifications()
  }, [loadNotifications])

  // Load notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Helper function to get time ago string
  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'الآن'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `منذ ${minutes} دقيقة`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `منذ ${hours} ساعة`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `منذ ${days} يوم`
    }
  }

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      createdAt: new Date(),
      time: getTimeAgo(new Date())
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  const markAsRead = useCallback(async (id: number) => {
    try {
      await apiClient.put(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, unread: false, read_at: new Date() }
            : notification
        )
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.put('/notifications/mark-all-read')
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, unread: false, read_at: new Date() }))
      )
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  const removeNotification = useCallback(async (id: number) => {
    try {
      await apiClient.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications,
    loadNotifications
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}
