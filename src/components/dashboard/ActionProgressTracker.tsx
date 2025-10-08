import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  Calendar,
  User,
  Target,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'

interface ActionItem {
  id: number
  task: string
  description?: string
  assigned_to?: string
  due_date: string
  status: string
  completion_percentage: number
  capa_id: number
  capa_title: string
  type: 'corrective' | 'preventive' | 'verification'
  notes?: string
}

interface ActionProgressTrackerProps {
  capaId?: number
  actionType?: 'corrective' | 'preventive' | 'verification'
  assignedToId?: number
}

const ActionProgressTracker: React.FC<ActionProgressTrackerProps> = ({
  capaId,
  actionType,
  assignedToId
}) => {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchActions = async () => {
    try {
      setLoading(true)
      setError(null)

      let endpoint = '/api/actions/'
      const params = new URLSearchParams()

      if (capaId) params.append('capa_id', capaId.toString())
      if (actionType) params.append('type', actionType)
      if (assignedToId) params.append('assigned_to_id', assignedToId.toString())

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await apiClient.request(endpoint)
      const actionsData = response.data || response
      setActions(Array.isArray(actionsData) ? actionsData : [])
    } catch (err) {
      console.error('Failed to fetch actions:', err)
      setError('فشل في تحميل الإجراءات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActions()
  }, [capaId, actionType, assignedToId])

  const updateActionStatus = async (actionId: number, newStatus: string, newProgress?: number) => {
    try {
      const updateData: any = { status: newStatus }
      if (newProgress !== undefined) {
        updateData.completion_percentage = newProgress
      }

      await apiClient.request(`/api/actions/${actionId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      // Update local state
      setActions(prev => prev.map(action => 
        action.id === actionId 
          ? { ...action, status: newStatus, completion_percentage: newProgress || action.completion_percentage }
          : action
      ))
    } catch (err) {
      console.error('Failed to update action:', err)
      alert('فشل في تحديث حالة الإجراء')
    }
  }

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

  const getTypeText = (type: string) => {
    const texts = {
      'corrective': 'تصحيحي',
      'preventive': 'وقائي',
      'verification': 'تحقق'
    }
    return texts[type as keyof typeof texts] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'corrective': 'bg-red-100 text-red-800',
      'preventive': 'bg-blue-100 text-blue-800',
      'verification': 'bg-green-100 text-green-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US')
  }

  const getDaysUntilDeadline = (dateString: string) => {
    const today = new Date()
    const deadline = new Date(dateString)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isOverdue = (dateString: string, status: string) => {
    return getDaysUntilDeadline(dateString) < 0 && status !== 'completed'
  }

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.capa_title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || action.status === statusFilter
    const matchesType = typeFilter === 'all' || action.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل الإجراءات...</span>
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
            <Button onClick={fetchActions} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
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
            <Target className="w-6 h-6 text-blue-600" />
            متتبع تقدم الإجراءات
          </h1>
          <p className="text-gray-600">
            متابعة وتحديث حالة الإجراءات التصحيحية والوقائية
          </p>
        </div>
        <Button onClick={fetchActions} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الإجراءات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">معلق</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
                <option value="overdue">متأخر</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="corrective">تصحيحي</option>
                <option value="preventive">وقائي</option>
                <option value="verification">تحقق</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <div className="space-y-4">
        {filteredActions.map((action) => (
          <Card key={action.id} className={`${isOverdue(action.due_date, action.status) ? 'border-red-200 bg-red-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{action.task}</h3>
                    <Badge className={getTypeColor(action.type)}>
                      {getTypeText(action.type)}
                    </Badge>
                    <Badge className={getStatusColor(action.status)}>
                      {getStatusText(action.status)}
                    </Badge>
                    {isOverdue(action.due_date, action.status) && (
                      <Badge className="bg-red-100 text-red-800">
                        متأخر
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">الخطة: {action.capa_title}</p>
                  {action.description && (
                    <p className="text-sm text-gray-700 mb-2">{action.description}</p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">التقدم</span>
                  <span className="text-sm text-gray-600">{action.completion_percentage}%</span>
                </div>
                <Progress value={action.completion_percentage} className="h-2" />
              </div>

              {/* Action Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">الموعد النهائي</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(action.due_date)}</p>
                    <p className="text-xs text-gray-500">
                      {getDaysUntilDeadline(action.due_date) > 0 
                        ? `متبقي ${getDaysUntilDeadline(action.due_date)} يوم`
                        : getDaysUntilDeadline(action.due_date) === 0 
                        ? 'اليوم'
                        : `متأخر ${Math.abs(getDaysUntilDeadline(action.due_date))} يوم`
                      }
                    </p>
                  </div>
                </div>

                {action.assigned_to && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">المسؤول</p>
                      <p className="text-sm font-medium text-gray-900">{action.assigned_to}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">الحالة</p>
                    <p className="text-sm font-medium text-gray-900">{getStatusText(action.status)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {action.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => updateActionStatus(action.id, 'in_progress', 10)}
                    className="flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    بدء
                  </Button>
                )}

                {action.status === 'in_progress' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateActionStatus(action.id, 'pending', 0)}
                      className="flex items-center gap-1"
                    >
                      <Pause className="w-4 h-4" />
                      إيقاف
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateActionStatus(action.id, 'completed', 100)}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      إكمال
                    </Button>
                  </>
                )}

                {action.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateActionStatus(action.id, 'in_progress', 50)}
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    إعادة فتح
                  </Button>
                )}

                {action.status === 'overdue' && (
                  <Button
                    size="sm"
                    onClick={() => updateActionStatus(action.id, 'in_progress', 10)}
                    className="flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    بدء
                  </Button>
                )}
              </div>

              {action.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>ملاحظات:</strong> {action.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد إجراءات</p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'لا توجد إجراءات تطابق الفلاتر المحددة'
              : 'لم يتم العثور على أي إجراءات للمعايير المحددة'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default ActionProgressTracker
