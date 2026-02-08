import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  Bell,
  Filter,
  RefreshCw
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatDDMMYYYY } from '@/lib/date'

interface DashboardStats {
  total_capas: number
  overdue_capas: number
  completed_this_month: number
  critical_pending: number
  average_completion_time: number
  cost_savings: number
}

interface OverdueAction {
  id: number
  task: string
  due_date: string
  status: string
  capa_id: number
  capa_title: string
  assigned_to?: string
}

interface UpcomingDeadline {
  id: number
  task: string
  due_date: string
  status: string
  capa_id: number
  capa_title: string
  assigned_to?: string
}

interface OverdueActions {
  corrective_actions: OverdueAction[]
  preventive_actions: OverdueAction[]
  verification_steps: OverdueAction[]
}

interface UpcomingDeadlines {
  corrective_actions: UpcomingDeadline[]
  preventive_actions: UpcomingDeadline[]
  verification_steps: UpcomingDeadline[]
}

const EnhancedCapaDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [overdueActions, setOverdueActions] = useState<OverdueActions | null>(null)
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadlines | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    const normalize = (v: any) => v?.data ?? v

    const results = await Promise.allSettled([
      apiClient.request('/api/dashboard/stats/'),
      apiClient.request('/api/dashboard/overdue/'),
      apiClient.request('/api/dashboard/upcoming/'),
    ])

    const [statsRes, overdueRes, upcomingRes] = results
    const errors: string[] = []

    if (statsRes.status === 'fulfilled') {
      setStats(normalize(statsRes.value))
    } else {
      setStats(null)
      errors.push('تعذر تحميل مؤشرات الداشبورد')
    }

    if (overdueRes.status === 'fulfilled') {
      setOverdueActions(normalize(overdueRes.value))
    } else {
      setOverdueActions(null)
      errors.push('تعذر تحميل الإجراءات المتأخرة')
    }

    if (upcomingRes.status === 'fulfilled') {
      setUpcomingDeadlines(normalize(upcomingRes.value))
    } else {
      setUpcomingDeadlines(null)
      errors.push('تعذر تحميل المواعيد القادمة')
    }

    if (errors.length) setError(errors.join(' • '))

    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      'pending': 'معلق',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'overdue': 'متأخر',
      'cancelled': 'ملغي'
    }
    return texts[status as keyof typeof texts] || status
  }

  const formatDate = (dateString: string) => {
    return formatDDMMYYYY(dateString as any)
  }

  const getDaysUntilDeadline = (dateString: string) => {
    const today = new Date()
    const deadline = new Date(dateString)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل الداشبورد...</span>
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
            <BarChart3 className="w-6 h-6 text-blue-600" />
            داشبورد الخطط التصحيحية المحسن
          </h1>
          <p className="text-gray-600">
            متابعة شاملة لتقدم الإجراءات التصحيحية والوقائية
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              آخر تحديث: {lastUpdated.toLocaleString('ar-SA')}
            </p>
          )}
        </div>
        <Button onClick={fetchDashboardData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold mb-1">تنبيه</div>
              <div className="text-sm">{error}</div>
              <div className="text-xs text-yellow-800 mt-1">
                سيتم عرض ما توفر من البيانات، ويمكنك إعادة المحاولة لاحقاً.
              </div>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الخطط</p>
                {stats ? (
                  <p className="text-2xl font-bold text-gray-900">{stats.total_capas}</p>
                ) : (
                  <div className="mt-2 h-8 w-16 rounded bg-gray-200 animate-pulse" />
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متأخرة</p>
                {stats ? (
                  <p className="text-2xl font-bold text-red-600">{stats.overdue_capas}</p>
                ) : (
                  <div className="mt-2 h-8 w-16 rounded bg-gray-200 animate-pulse" />
                )}
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">مكتملة هذا الشهر</p>
                {stats ? (
                  <p className="text-2xl font-bold text-green-600">{stats.completed_this_month}</p>
                ) : (
                  <div className="mt-2 h-8 w-16 rounded bg-gray-200 animate-pulse" />
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">حرجة معلقة</p>
                {stats ? (
                  <p className="text-2xl font-bold text-orange-600">{stats.critical_pending}</p>
                ) : (
                  <div className="mt-2 h-8 w-16 rounded bg-gray-200 animate-pulse" />
                )}
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Now */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            الأولوية الآن
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const overdueList = overdueActions
              ? [
                  ...overdueActions.corrective_actions.map((a) => ({ ...a, bucket: 'متأخر' })),
                  ...overdueActions.preventive_actions.map((a) => ({ ...a, bucket: 'متأخر' })),
                  ...overdueActions.verification_steps.map((a) => ({ ...a, bucket: 'متأخر' })),
                ]
              : []
            const upcomingList = upcomingDeadlines
              ? [
                  ...upcomingDeadlines.corrective_actions.map((a) => ({ ...a, bucket: 'قادم' })),
                  ...upcomingDeadlines.preventive_actions.map((a) => ({ ...a, bucket: 'قادم' })),
                  ...upcomingDeadlines.verification_steps.map((a) => ({ ...a, bucket: 'قادم' })),
                ]
              : []

            const items = [...overdueList, ...upcomingList].slice(0, 3)

            if (items.length === 0) {
              return (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-600">لا توجد عناصر عاجلة الآن</p>
                  <p className="text-sm text-gray-400 mt-1">استمر في متابعة تقدم الخطط والإجراءات</p>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                {items.map((it: any) => (
                  <div key={`${it.bucket}-${it.id}`} className="rounded-lg border p-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={it.bucket === 'متأخر' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                            {it.bucket}
                          </Badge>
                          <Badge className={getStatusColor(it.status)}>{getStatusText(it.status)}</Badge>
                        </div>
                        <p className="font-medium text-gray-900 mt-2 break-words">{it.task}</p>
                        <p className="text-sm text-gray-600 mt-1 break-words">الخطة: {it.capa_title}</p>
                        {it.due_date && (
                          <p className="text-xs text-gray-500 mt-1">الموعد: {formatDate(it.due_date)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                متوسط وقت الإنجاز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.average_completion_time}</p>
                <p className="text-sm text-gray-600">يوم</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                توفير التكلفة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.cost_savings.toLocaleString()}</p>
                <p className="text-sm text-gray-600">ريال</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Actions */}
      {overdueActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              الإجراءات المتأخرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Corrective Actions */}
              {overdueActions.corrective_actions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الإجراءات التصحيحية</h4>
                  <div className="space-y-2">
                    {overdueActions.corrective_actions.map((action) => (
                      <div key={action.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{action.task}</p>
                            <p className="text-sm text-gray-600">الخطة: {action.capa_title}</p>
                            <p className="text-sm text-red-600">
                              متأخر منذ {Math.abs(getDaysUntilDeadline(action.due_date))} يوم
                            </p>
                          </div>
                          <Badge className={getStatusColor(action.status)}>
                            {getStatusText(action.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preventive Actions */}
              {overdueActions.preventive_actions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الإجراءات الوقائية</h4>
                  <div className="space-y-2">
                    {overdueActions.preventive_actions.map((action) => (
                      <div key={action.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{action.task}</p>
                            <p className="text-sm text-gray-600">الخطة: {action.capa_title}</p>
                            <p className="text-sm text-red-600">
                              متأخر منذ {Math.abs(getDaysUntilDeadline(action.due_date))} يوم
                            </p>
                          </div>
                          <Badge className={getStatusColor(action.status)}>
                            {getStatusText(action.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Steps */}
              {overdueActions.verification_steps.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">خطوات التحقق</h4>
                  <div className="space-y-2">
                    {overdueActions.verification_steps.map((step) => (
                      <div key={step.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{step.task}</p>
                            <p className="text-sm text-gray-600">الخطة: {step.capa_title}</p>
                            <p className="text-sm text-red-600">
                              متأخر منذ {Math.abs(getDaysUntilDeadline(step.due_date))} يوم
                            </p>
                          </div>
                          <Badge className={getStatusColor(step.status)}>
                            {getStatusText(step.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overdueActions.corrective_actions.length === 0 && 
               overdueActions.preventive_actions.length === 0 && 
               overdueActions.verification_steps.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">لا توجد إجراءات متأخرة</p>
                  <p className="text-sm text-gray-400 mt-2">جميع الإجراءات في الموعد المحدد</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              المواعيد القادمة (7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Corrective Actions */}
              {upcomingDeadlines.corrective_actions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الإجراءات التصحيحية</h4>
                  <div className="space-y-2">
                    {upcomingDeadlines.corrective_actions.map((action) => (
                      <div key={action.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{action.task}</p>
                            <p className="text-sm text-gray-600">الخطة: {action.capa_title}</p>
                            <p className="text-sm text-blue-600">
                              {getDaysUntilDeadline(action.due_date) > 0 
                                ? `متبقي ${getDaysUntilDeadline(action.due_date)} يوم`
                                : 'اليوم'
                              }
                            </p>
                          </div>
                          <Badge className={getStatusColor(action.status)}>
                            {getStatusText(action.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preventive Actions */}
              {upcomingDeadlines.preventive_actions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الإجراءات الوقائية</h4>
                  <div className="space-y-2">
                    {upcomingDeadlines.preventive_actions.map((action) => (
                      <div key={action.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{action.task}</p>
                            <p className="text-sm text-gray-600">الخطة: {action.capa_title}</p>
                            <p className="text-sm text-blue-600">
                              {getDaysUntilDeadline(action.due_date) > 0 
                                ? `متبقي ${getDaysUntilDeadline(action.due_date)} يوم`
                                : 'اليوم'
                              }
                            </p>
                          </div>
                          <Badge className={getStatusColor(action.status)}>
                            {getStatusText(action.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Steps */}
              {upcomingDeadlines.verification_steps.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">خطوات التحقق</h4>
                  <div className="space-y-2">
                    {upcomingDeadlines.verification_steps.map((step) => (
                      <div key={step.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{step.task}</p>
                            <p className="text-sm text-gray-600">الخطة: {step.capa_title}</p>
                            <p className="text-sm text-blue-600">
                              {getDaysUntilDeadline(step.due_date) > 0 
                                ? `متبقي ${getDaysUntilDeadline(step.due_date)} يوم`
                                : 'اليوم'
                              }
                            </p>
                          </div>
                          <Badge className={getStatusColor(step.status)}>
                            {getStatusText(step.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {upcomingDeadlines.corrective_actions.length === 0 && 
               upcomingDeadlines.preventive_actions.length === 0 && 
               upcomingDeadlines.verification_steps.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">لا توجد مواعيد قادمة</p>
                  <p className="text-sm text-gray-400 mt-2">لا توجد إجراءات مستحقة خلال الأسبوع القادم</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedCapaDashboard
