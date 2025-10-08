import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X, 
  Settings,
  Filter,
  RefreshCw,
  Mail,
  MessageSquare,
  Calendar
} from 'lucide-react'
import { apiClient } from '@/lib/api'

interface Alert {
  id: number
  type: 'overdue' | 'upcoming' | 'escalation' | 'completion' | 'system'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  read: boolean
  action_required: boolean
  capa_id?: number
  capa_title?: string
  action_id?: number
  due_date?: string
  days_until_due?: number
}

interface AlertSystemProps {
  userId?: number
  showSettings?: boolean
}

const AlertSystem: React.FC<AlertSystemProps> = ({
  userId,
  showSettings = false
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'overdue' | 'upcoming'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)

      let endpoint = '/api/alerts/'
      const params = new URLSearchParams()

      if (userId) params.append('user_id', userId.toString())
      if (filter !== 'all') params.append('filter', filter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await apiClient.request(endpoint)
      const alertsData = response.data || response
      setAlerts(Array.isArray(alertsData) ? alertsData : [])
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      setError('فشل في تحميل التنبيهات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    
    // Set up polling for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [userId, filter, priorityFilter])

  const markAsRead = async (alertId: number) => {
    try {
      await apiClient.request(`/api/alerts/${alertId}/read`, {
        method: 'PUT'
      })

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ))
    } catch (err) {
      console.error('Failed to mark alert as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiClient.request('/api/alerts/mark-all-read', {
        method: 'PUT'
      })

      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })))
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err)
    }
  }

  const deleteAlert = async (alertId: number) => {
    try {
      await apiClient.request(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      })

      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    } catch (err) {
      console.error('Failed to delete alert:', err)
    }
  }

  const getAlertIcon = (type: string) => {
    const icons = {
      'overdue': AlertTriangle,
      'upcoming': Clock,
      'escalation': AlertTriangle,
      'completion': CheckCircle,
      'system': Bell
    }
    return icons[type as keyof typeof icons] || Bell
  }

  const getAlertColor = (type: string, priority: string) => {
    if (priority === 'critical') {
      return 'border-red-200 bg-red-50'
    } else if (priority === 'high') {
      return 'border-orange-200 bg-orange-50'
    } else if (type === 'overdue') {
      return 'border-red-200 bg-red-50'
    } else if (type === 'upcoming') {
      return 'border-yellow-200 bg-yellow-50'
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

  const getTypeText = (type: string) => {
    const texts = {
      'overdue': 'متأخر',
      'upcoming': 'قادم',
      'escalation': 'تصعيد',
      'completion': 'إكمال',
      'system': 'نظام'
    }
    return texts[type as keyof typeof texts] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US')
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const alertDate = new Date(dateString)
    const diffTime = now.getTime() - alertDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffDays > 0) {
      return `منذ ${diffDays} يوم`
    } else if (diffHours > 0) {
      return `منذ ${diffHours} ساعة`
    } else if (diffMinutes > 0) {
      return `منذ ${diffMinutes} دقيقة`
    } else {
      return 'الآن'
    }
  }

  const unreadCount = alerts.filter(alert => !alert.read).length
  const criticalCount = alerts.filter(alert => alert.priority === 'critical' && !alert.read).length

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل التنبيهات...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل التنبيهات</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchAlerts} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            نظام التنبيهات
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {unreadCount} غير مقروء
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {criticalCount} حرج
              </Badge>
            )}
          </h1>
          <p className="text-gray-600">
            متابعة التنبيهات والإشعارات المهمة
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              تعيين الكل كمقروء
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">فلترة:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">الكل</option>
                <option value="unread">غير مقروء</option>
                <option value="overdue">متأخر</option>
                <option value="upcoming">قادم</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">الأولوية:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">الكل</option>
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">عالي</option>
                <option value="critical">حرج</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.type)
          const colorClass = getAlertColor(alert.type, alert.priority)
          
          return (
            <Card 
              key={alert.id} 
              className={`${colorClass} ${!alert.read ? 'ring-2 ring-blue-200' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Alert Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    alert.priority === 'critical' ? 'bg-red-100 text-red-600' :
                    alert.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {alert.title}
                          </h4>
                          <Badge className={getPriorityColor(alert.priority)}>
                            {getPriorityText(alert.priority)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getTypeText(alert.type)}
                          </Badge>
                          {!alert.read && (
                            <Badge className="bg-blue-100 text-blue-800">
                              جديد
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {alert.capa_title && (
                            <span>الخطة: {alert.capa_title}</span>
                          )}
                          {alert.due_date && (
                            <span>الموعد النهائي: {formatDate(alert.due_date)}</span>
                          )}
                          {alert.days_until_due !== undefined && (
                            <span>
                              {alert.days_until_due > 0 
                                ? `متبقي ${alert.days_until_due} يوم`
                                : alert.days_until_due === 0 
                                ? 'اليوم'
                                : `متأخر ${Math.abs(alert.days_until_due)} يوم`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right text-xs text-gray-500">
                        <div>{formatTime(alert.created_at)}</div>
                        <div>{getRelativeTime(alert.created_at)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {!alert.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(alert.id)}
                        className="text-xs"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteAlert(alert.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد تنبيهات</p>
          <p className="text-sm text-gray-400 mt-2">
            {filter !== 'all' || priorityFilter !== 'all'
              ? 'لا توجد تنبيهات تطابق الفلاتر المحددة'
              : 'جميع التنبيهات محدثة'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default AlertSystem
