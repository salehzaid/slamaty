import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Brain,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { apiClient } from '@/lib/api'

interface AnalyticsData {
  trends: {
    period: string
    completion_rate: number
    overdue_rate: number
    cost_efficiency: number
    user_satisfaction: number
  }[]
  predictions: {
    next_month_completion: number
    risk_factors: string[]
    recommendations: string[]
    cost_forecast: number
  }
  performance_metrics: {
    avg_response_time: number
    escalation_rate: number
    first_time_fix_rate: number
    customer_satisfaction: number
  }
  department_comparison: Array<{
    department: string
    efficiency_score: number
    completion_rate: number
    avg_time: number
    cost_per_capa: number
  }>
  risk_analysis: Array<{
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    description: string
    probability: number
    impact: number
    mitigation: string
  }>
}

interface AdvancedAnalyticsProps {
  dateRange?: {
    start: Date
    end: Date
  }
  departmentId?: number
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  dateRange,
  departmentId
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'cost' | 'time' | 'satisfaction'>('completion')
  const [predictionPeriod, setPredictionPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('3m')

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      let endpoint = '/api/analytics/advanced/'
      const params = new URLSearchParams()

      params.append('prediction_period', predictionPeriod)
      if (departmentId) params.append('department_id', departmentId.toString())
      if (dateRange) {
        params.append('start_date', dateRange.start.toISOString())
        params.append('end_date', dateRange.end.toISOString())
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await apiClient.request(endpoint)
      const data = response.data || response
      setAnalyticsData(data)
    } catch (err) {
      console.error('Failed to fetch analytics data:', err)
      setError('فشل في تحميل البيانات التحليلية')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, departmentId, predictionPeriod])

  const getRiskColor = (level: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRiskText = (level: string) => {
    const texts = {
      'low': 'منخفض',
      'medium': 'متوسط',
      'high': 'عالي',
      'critical': 'حرج'
    }
    return texts[level as keyof typeof texts] || level
  }

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const exportAnalytics = async (format: 'pdf' | 'excel') => {
    try {
      let endpoint = `/api/analytics/export/${format}/`
      const params = new URLSearchParams()

      params.append('prediction_period', predictionPeriod)
      if (departmentId) params.append('department_id', departmentId.toString())
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
      a.download = `advanced-analytics-${predictionPeriod}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to export analytics:', err)
      alert('فشل في تصدير التحليلات')
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل التحليلات المتقدمة...</span>
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
            <Button onClick={fetchAnalyticsData} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد بيانات تحليلية</p>
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
            <Brain className="w-6 h-6 text-purple-600" />
            التحليلات المتقدمة والتنبؤات
          </h1>
          <p className="text-gray-600">
            تحليل شامل مع تنبؤات ذكية وتوصيات محسنة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={predictionPeriod}
            onChange={(e) => setPredictionPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="1m">شهر واحد</option>
            <option value="3m">3 أشهر</option>
            <option value="6m">6 أشهر</option>
            <option value="1y">سنة واحدة</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAnalytics('pdf')}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAnalytics('excel')}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسط وقت الاستجابة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analyticsData.performance_metrics.avg_response_time}
                </p>
                <p className="text-xs text-gray-500">ساعة</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل التصعيد</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analyticsData.performance_metrics.escalation_rate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل الإصلاح الأول</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.performance_metrics.first_time_fix_rate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">رضا العملاء</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.performance_metrics.customer_satisfaction}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            التنبؤات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">إنجاز الشهر القادم</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {analyticsData.predictions.next_month_completion}%
                </p>
                <p className="text-sm text-gray-600">متوقع إنجاز الخطط</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">التكلفة المتوقعة</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analyticsData.predictions.cost_forecast)}
                </p>
                <p className="text-sm text-gray-600">للفترة القادمة</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">عوامل المخاطر</h4>
                <div className="space-y-2">
                  {analyticsData.predictions.risk_factors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">التوصيات الذكية</h4>
            <div className="space-y-2">
              {analyticsData.predictions.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            مقارنة أداء الأقسام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.department_comparison.map((dept, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{dept.department}</h4>
                  <Badge className={`${getEfficiencyColor(dept.efficiency_score)} bg-opacity-20`}>
                    {dept.efficiency_score}% كفاءة
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">معدل الإنجاز</p>
                    <p className="font-medium">{dept.completion_rate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">متوسط الوقت</p>
                    <p className="font-medium">{dept.avg_time} يوم</p>
                  </div>
                  <div>
                    <p className="text-gray-600">التكلفة لكل خطة</p>
                    <p className="font-medium">{formatCurrency(dept.cost_per_capa)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">نقاط الكفاءة</p>
                    <p className="font-medium">{dept.efficiency_score}/100</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>مؤشر الكفاءة</span>
                    <span>{dept.efficiency_score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        dept.efficiency_score >= 80 ? 'bg-green-500' :
                        dept.efficiency_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${dept.efficiency_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            تحليل المخاطر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.risk_analysis.map((risk, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{risk.description}</h4>
                    <p className="text-sm text-gray-600 mb-2">{risk.mitigation}</p>
                  </div>
                  <Badge className={getRiskColor(risk.risk_level)}>
                    {getRiskText(risk.risk_level)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">احتمالية الحدوث</p>
                    <p className="font-medium">{risk.probability}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">تأثير المخاطر</p>
                    <p className="font-medium">{risk.impact}/10</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>مؤشر المخاطر</span>
                    <span>{Math.round(risk.probability * risk.impact / 10)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        risk.risk_level === 'critical' ? 'bg-red-500' :
                        risk.risk_level === 'high' ? 'bg-orange-500' :
                        risk.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.round(risk.probability * risk.impact / 10)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-green-600" />
            اتجاهات الأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <LineChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">رسم بياني تفاعلي للاتجاهات</p>
              <p className="text-sm text-gray-400">سيتم إضافة الرسوم البيانية في التحديث القادم</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvancedAnalytics
