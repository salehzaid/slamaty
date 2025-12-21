import React, { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAllCapasUnfiltered } from '@/hooks/useCapas'
import { useNavigate } from 'react-router-dom'

const AlertsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: capas, loading: capasLoading, refetch } = useAllCapasUnfiltered({ limit: 100 })
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    if (!capas || !Array.isArray(capas)) return

    const alertsList: any[] = []
    const now = new Date()

    capas.forEach((capa: any) => {
      const targetDate = capa.target_date ? new Date(capa.target_date) : null
      const daysUntilDeadline = targetDate ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

      // Overdue CAPAs
      if (targetDate && targetDate < now && !['closed', 'verified', 'implemented'].includes(capa.status)) {
        alertsList.push({
          id: `overdue-${capa.id}`,
          type: 'overdue',
          severity: 'high',
          title: `خطة تصحيحية متأخرة: ${capa.title}`,
          description: `تجاوزت الخطة التصحيحية الموعد النهائي بمقدار ${Math.abs(daysUntilDeadline || 0)} يوم`,
          capaId: capa.id,
          capaTitle: capa.title,
          department: capa.department,
          targetDate: capa.target_date,
          status: capa.status,
          daysOverdue: Math.abs(daysUntilDeadline || 0)
        })
      }

      // Approaching deadline (within 3 days)
      if (targetDate && daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 3 && !['closed', 'verified', 'implemented'].includes(capa.status)) {
        alertsList.push({
          id: `approaching-${capa.id}`,
          type: 'approaching',
          severity: 'medium',
          title: `اقتراب الموعد النهائي: ${capa.title}`,
          description: `الموعد النهائي للخطة التصحيحية خلال ${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'يوم' : 'أيام'}`,
          capaId: capa.id,
          capaTitle: capa.title,
          department: capa.department,
          targetDate: capa.target_date,
          status: capa.status,
          daysRemaining: daysUntilDeadline
        })
      }

      // High severity CAPAs
      if (capa.severity && capa.severity >= 4 && !['closed', 'verified'].includes(capa.status)) {
        alertsList.push({
          id: `high-severity-${capa.id}`,
          type: 'high_severity',
          severity: 'high',
          title: `خطة تصحيحية عالية الخطورة: ${capa.title}`,
          description: `خطة تصحيحية بدرجة خطورة ${capa.severity}/5 تحتاج إلى متابعة عاجلة`,
          capaId: capa.id,
          capaTitle: capa.title,
          department: capa.department,
          // preserve numeric severity as severityLevel to avoid duplicate object keys
          severityLevel: capa.severity,
          status: capa.status
        })
      }

      // Status change alerts (if status_history is available)
      if (capa.status_history) {
        try {
          const history = typeof capa.status_history === 'string' 
            ? JSON.parse(capa.status_history) 
            : capa.status_history
          
          if (Array.isArray(history) && history.length > 0) {
            const recentChange = history[history.length - 1]
            const changeDate = recentChange.timestamp ? new Date(recentChange.timestamp) : null
            const daysSinceChange = changeDate ? Math.ceil((now.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24)) : null

            // Alert for recent status changes (within last 24 hours)
            if (daysSinceChange !== null && daysSinceChange <= 1) {
              alertsList.push({
                id: `status-change-${capa.id}`,
                type: 'status_change',
                severity: 'low',
                title: `تغيير حالة: ${capa.title}`,
                description: `تم تغيير حالة الخطة من "${recentChange.from_status}" إلى "${recentChange.to_status}"`,
                capaId: capa.id,
                capaTitle: capa.title,
                department: capa.department,
                fromStatus: recentChange.from_status,
                toStatus: recentChange.to_status,
                timestamp: recentChange.timestamp
              })
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    })

    // Sort by severity and date
    alertsList.sort((a, b) => {
      const severityOrder: any = { 'high': 3, 'medium': 2, 'low': 1 }
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
      if (severityDiff !== 0) return severityDiff
      
      const dateA = a.targetDate || a.timestamp ? new Date(a.targetDate || a.timestamp).getTime() : 0
      const dateB = b.targetDate || b.timestamp ? new Date(b.targetDate || b.timestamp).getTime() : 0
      return dateB - dateA
    })

    setAlerts(alertsList)
  }, [capas, capasLoading])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'approaching':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'high_severity':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'status_change':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    const texts: any = {
      'pending': 'معلقة',
      'in_progress': 'قيد التنفيذ',
      'implemented': 'منفذة',
      'verified': 'متحققة',
      'closed': 'مغلقة',
      'rejected': 'مرفوضة'
    }
    return texts[status] || status
  }

  const highPriorityAlerts = alerts.filter(a => a.severity === 'high')
  const mediumPriorityAlerts = alerts.filter(a => a.severity === 'medium')
  const lowPriorityAlerts = alerts.filter(a => a.severity === 'low')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-600" />
            التنبيهات
          </h1>
          <p className="text-gray-600 mt-1">
            إدارة التنبيهات والإشعارات المهمة للخطط التصحيحية
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي التنبيهات</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">عاجلة</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityAlerts.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسطة</p>
                <p className="text-2xl font-bold text-yellow-600">{mediumPriorityAlerts.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">منخفضة</p>
                <p className="text-2xl font-bold text-blue-600">{lowPriorityAlerts.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {capasLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد تنبيهات</p>
            <p className="text-sm text-gray-400 mt-2">
              جميع الخطط التصحيحية محدثة ولا توجد تنبيهات
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card 
              key={alert.id}
              className={`hover:shadow-lg transition-shadow cursor-pointer border-2 ${getSeverityColor(alert.severity)}`}
              onClick={() => navigate(`/capa/edit/${alert.capaId}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity === 'high' ? 'عاجل' : alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-3">{alert.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">{alert.capaTitle}</span>
                      <span>القسم: {alert.department}</span>
                      {alert.targetDate && (
                        <span>
                          الموعد النهائي: {new Date(alert.targetDate).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                      {alert.daysOverdue && (
                        <span className="text-red-600 font-semibold">
                          متأخرة {alert.daysOverdue} يوم
                        </span>
                      )}
                      {alert.daysRemaining && (
                        <span className="text-yellow-600 font-semibold">
                          متبقى {alert.daysRemaining} يوم
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AlertsPage

