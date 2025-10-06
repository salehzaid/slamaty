import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Target,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit
} from 'lucide-react'
import { apiClient } from '@/lib/api'

interface TimelineEvent {
  id: number
  type: 'capa_created' | 'action_started' | 'action_completed' | 'verification_step' | 'status_change'
  title: string
  description: string
  timestamp: string
  user_name?: string
  capa_id: number
  capa_title: string
  action_id?: number
  action_type?: 'corrective' | 'preventive' | 'verification'
  status?: string
  progress_percentage?: number
}

interface CapaTimelineViewProps {
  capaId?: number
  dateRange?: {
    start: Date
    end: Date
  }
}

const CapaTimelineView: React.FC<CapaTimelineViewProps> = ({
  capaId,
  dateRange
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'all'>('week')

  const fetchTimelineEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      let endpoint = '/api/timeline/events/'
      const params = new URLSearchParams()

      if (capaId) params.append('capa_id', capaId.toString())
      
      if (dateRange) {
        params.append('start_date', dateRange.start.toISOString())
        params.append('end_date', dateRange.end.toISOString())
      } else {
        // Default to current week
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        
        params.append('start_date', startOfWeek.toISOString())
        params.append('end_date', endOfWeek.toISOString())
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await apiClient.request(endpoint)
      const eventsData = response.data || response
      setEvents(Array.isArray(eventsData) ? eventsData : [])
    } catch (err) {
      console.error('Failed to fetch timeline events:', err)
      setError('فشل في تحميل أحداث الجدول الزمني')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimelineEvents()
  }, [capaId, currentDate, viewMode, dateRange])

  const getEventIcon = (type: string) => {
    const icons = {
      'capa_created': Target,
      'action_started': Play,
      'action_completed': CheckCircle,
      'verification_step': CheckCircle,
      'status_change': Edit
    }
    return icons[type as keyof typeof icons] || Clock
  }

  const getEventColor = (type: string) => {
    const colors = {
      'capa_created': 'text-blue-600 bg-blue-100',
      'action_started': 'text-yellow-600 bg-yellow-100',
      'action_completed': 'text-green-600 bg-green-100',
      'verification_step': 'text-purple-600 bg-purple-100',
      'status_change': 'text-gray-600 bg-gray-100'
    }
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getEventTypeText = (type: string) => {
    const texts = {
      'capa_created': 'إنشاء خطة',
      'action_started': 'بدء إجراء',
      'action_completed': 'إكمال إجراء',
      'verification_step': 'خطوة تحقق',
      'status_change': 'تغيير حالة'
    }
    return texts[type as keyof typeof texts] || type
  }

  const getActionTypeText = (type: string) => {
    const texts = {
      'corrective': 'تصحيحي',
      'preventive': 'وقائي',
      'verification': 'تحقق'
    }
    return texts[type as keyof typeof texts] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA')
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const eventDate = new Date(dateString)
    const diffTime = now.getTime() - eventDate.getTime()
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

  const groupEventsByDate = (events: TimelineEvent[]) => {
    const grouped: { [key: string]: TimelineEvent[] } = {}
    
    events.forEach(event => {
      const date = new Date(event.timestamp).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(event)
    })

    // Sort events within each date by timestamp
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    })

    return grouped
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    
    setCurrentDate(newDate)
  }

  const getDateRangeText = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      return `${startOfWeek.toLocaleDateString('ar-SA')} - ${endOfWeek.toLocaleDateString('ar-SA')}`
    } else if (viewMode === 'month') {
      return currentDate.toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'long' 
      })
    } else {
      return 'جميع الأحداث'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل الجدول الزمني...</span>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchTimelineEvents} className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const groupedEvents = groupEventsByDate(events)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            الجدول الزمني للخطط التصحيحية
          </h1>
          <p className="text-gray-600">
            متابعة تطور الإجراءات والأحداث عبر الوقت
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('week')}
            className={viewMode === 'week' ? 'bg-blue-100 text-blue-700' : ''}
          >
            أسبوع
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('month')}
            className={viewMode === 'month' ? 'bg-blue-100 text-blue-700' : ''}
          >
            شهر
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('all')}
            className={viewMode === 'all' ? 'bg-blue-100 text-blue-700' : ''}
          >
            الكل
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      {viewMode !== 'all' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
                className="flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getDateRangeText()}
                </h3>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
                className="flex items-center gap-1"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد أحداث</p>
            <p className="text-sm text-gray-400 mt-2">
              لم يتم العثور على أي أحداث في الفترة المحددة
            </p>
          </div>
        ) : (
          Object.entries(groupedEvents)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateEvents]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {new Date(date).toLocaleDateString('ar-SA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dateEvents.map((event, index) => {
                      const Icon = getEventIcon(event.type)
                      const colorClass = getEventColor(event.type)
                      
                      return (
                        <div key={event.id} className="flex items-start gap-4">
                          {/* Timeline Icon */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          {/* Event Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {event.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {getEventTypeText(event.type)}
                                  </Badge>
                                  {event.action_type && (
                                    <Badge variant="outline" className="text-xs">
                                      {getActionTypeText(event.action_type)}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2">
                                  {event.description}
                                </p>
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>الخطة: {event.capa_title}</span>
                                  {event.user_name && (
                                    <span>بواسطة: {event.user_name}</span>
                                  )}
                                  {event.status && (
                                    <span>الحالة: {event.status}</span>
                                  )}
                                  {event.progress_percentage !== undefined && (
                                    <span>التقدم: {event.progress_percentage}%</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right text-xs text-gray-500">
                                <div>{formatTime(event.timestamp)}</div>
                                <div>{getRelativeTime(event.timestamp)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  )
}

export default CapaTimelineView
