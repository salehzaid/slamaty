import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'

interface ReportData {
  period: string
  total_capas: number
  completed_capas: number
  overdue_capas: number
  average_completion_time: number
  cost_savings: number
  department_stats: Array<{
    department: string
    total_capas: number
    completed_capas: number
    overdue_capas: number
    average_completion_time: number
  }>
  priority_breakdown: {
    low: number
    medium: number
    high: number
    critical: number
  }
  status_breakdown: {
    pending: number
    in_progress: number
    completed: number
    closed: number
  }
  monthly_trends: Array<{
    month: string
    created: number
    completed: number
    overdue: number
  }>
}

interface BasicReportsProps {
  dateRange?: {
    start: Date
    end: Date
  }
  departmentId?: number
}

const BasicReports: React.FC<BasicReportsProps> = ({
  dateRange,
  departmentId
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      let endpoint = '/api/reports/basic/'
      const params = new URLSearchParams()

      params.append('period', selectedPeriod)
      if (selectedDepartment !== 'all') {
        params.append('department_id', selectedDepartment)
      }
      
      if (dateRange) {
        params.append('start_date', dateRange.start.toISOString())
        params.append('end_date', dateRange.end.toISOString())
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await apiClient.request(endpoint)
      const data = response.data || response
      setReportData(data)
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      setError('فشل في تحميل بيانات التقرير')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod, selectedDepartment, dateRange])

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      let endpoint = `/api/reports/export/${format}/`
      const params = new URLSearchParams()

      params.append('period', selectedPeriod)
      if (selectedDepartment !== 'all') {
        params.append('department_id', selectedDepartment)
      }
      
      if (dateRange) {
        params.append('start_date', dateRange.start.toISOString())
        params.append('end_date', dateRange.end.toISOString())
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await fetch(endpoint)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `capa-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to export report:', err)
      alert('فشل في تصدير التقرير')
    }
  }

  const getCompletionRate = () => {
    if (!reportData || reportData.total_capas === 0) return 0
    return Math.round((reportData.completed_capas / reportData.total_capas) * 100)
  }

  const getOverdueRate = () => {
    if (!reportData || reportData.total_capas === 0) return 0
    return Math.round((reportData.overdue_capas / reportData.total_capas) * 100)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل التقرير...</span>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل التقرير</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchReportData} className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد بيانات للتقرير</p>
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
            التقارير الأساسية
          </h1>
          <p className="text-gray-600">
            تحليل شامل لأداء الخطط التصحيحية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('pdf')}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('excel')}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">الفترة:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">أسبوع</option>
                <option value="month">شهر</option>
                <option value="quarter">ربع سنة</option>
                <option value="year">سنة</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">القسم:</span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأقسام</option>
                {reportData.department_stats.map((dept, index) => (
                  <option key={index} value={dept.department}>
                    {dept.department}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الخطط</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.total_capas}</p>
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
                <p className="text-sm font-medium text-gray-600">معدل الإنجاز</p>
                <p className="text-2xl font-bold text-green-600">{getCompletionRate()}%</p>
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
                <p className="text-sm font-medium text-gray-600">معدل التأخير</p>
                <p className="text-2xl font-bold text-red-600">{getOverdueRate()}%</p>
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
                <p className="text-sm font-medium text-gray-600">متوسط وقت الإنجاز</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.average_completion_time}</p>
                <p className="text-xs text-gray-500">يوم</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            توزيع الأولوية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{reportData.priority_breakdown.low}</p>
              <p className="text-sm text-gray-600">منخفض</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{reportData.priority_breakdown.medium}</p>
              <p className="text-sm text-blue-600">متوسط</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{reportData.priority_breakdown.high}</p>
              <p className="text-sm text-orange-600">عالي</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{reportData.priority_breakdown.critical}</p>
              <p className="text-sm text-red-600">حرج</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            توزيع الحالة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{reportData.status_breakdown.pending}</p>
              <p className="text-sm text-yellow-600">معلق</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{reportData.status_breakdown.in_progress}</p>
              <p className="text-sm text-blue-600">قيد التنفيذ</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{reportData.status_breakdown.completed}</p>
              <p className="text-sm text-green-600">مكتمل</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{reportData.status_breakdown.closed}</p>
              <p className="text-sm text-gray-600">مغلق</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            أداء الأقسام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.department_stats.map((dept, index) => {
              const completionRate = dept.total_capas > 0 
                ? Math.round((dept.completed_capas / dept.total_capas) * 100)
                : 0
              
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{dept.department}</h4>
                    <Badge className={completionRate >= 80 ? 'bg-green-100 text-green-800' : 
                                     completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                     'bg-red-100 text-red-800'}>
                      {completionRate}% إنجاز
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">إجمالي</p>
                      <p className="font-medium">{dept.total_capas}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">مكتمل</p>
                      <p className="font-medium text-green-600">{dept.completed_capas}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">متأخر</p>
                      <p className="font-medium text-red-600">{dept.overdue_capas}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>التقدم</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          completionRate >= 80 ? 'bg-green-500' :
                          completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            الاتجاهات الشهرية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.monthly_trends.map((trend, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{trend.month}</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{trend.created}</p>
                    <p className="text-gray-600">منشأ</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{trend.completed}</p>
                    <p className="text-gray-600">مكتمل</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{trend.overdue}</p>
                    <p className="text-gray-600">متأخر</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BasicReports
