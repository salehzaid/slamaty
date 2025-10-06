import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Zap, 
  Database, 
  Cpu, 
  Memory, 
  HardDrive,
  Network,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Stop
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { apiClient } from '@/lib/api'

interface PerformanceMetrics {
  database: {
    query_time: number
    connection_pool: number
    cache_hit_ratio: number
    slow_queries: number
    total_queries: number
  }
  server: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    network_io: number
    response_time: number
  }
  application: {
    page_load_time: number
    api_response_time: number
    error_rate: number
    active_users: number
    cache_efficiency: number
  }
  recommendations: Array<{
    id: string
    type: 'database' | 'server' | 'application' | 'cache'
    priority: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    impact: string
    effort: 'low' | 'medium' | 'high'
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  }>
}

interface PerformanceOptimizerProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'database' | 'server' | 'application'>('database')

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.request('/api/performance/metrics/')
      const data = response.data || response
      setMetrics(data)
    } catch (err) {
      console.error('Failed to fetch performance metrics:', err)
      setError('فشل في تحميل مقاييس الأداء')
    } finally {
      setLoading(false)
    }
  }

  const applyOptimization = async (recommendationId: string) => {
    try {
      await apiClient.request(`/api/performance/optimize/${recommendationId}`, {
        method: 'POST'
      })

      // Refresh metrics after optimization
      await fetchMetrics()
      alert('تم تطبيق التحسين بنجاح')
    } catch (err) {
      console.error('Failed to apply optimization:', err)
      alert('فشل في تطبيق التحسين')
    }
  }

  const dismissRecommendation = async (recommendationId: string) => {
    try {
      await apiClient.request(`/api/performance/recommendations/${recommendationId}/dismiss`, {
        method: 'PUT'
      })

      setMetrics(prev => prev ? {
        ...prev,
        recommendations: prev.recommendations.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, status: 'dismissed' }
            : rec
        )
      } : null)
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err)
    }
  }

  const clearCache = async () => {
    try {
      await apiClient.request('/api/performance/cache/clear', {
        method: 'POST'
      })

      await fetchMetrics()
      alert('تم مسح الذاكرة المؤقتة بنجاح')
    } catch (err) {
      console.error('Failed to clear cache:', err)
      alert('فشل في مسح الذاكرة المؤقتة')
    }
  }

  const optimizeDatabase = async () => {
    try {
      await apiClient.request('/api/performance/database/optimize', {
        method: 'POST'
      })

      await fetchMetrics()
      alert('تم تحسين قاعدة البيانات بنجاح')
    } catch (err) {
      console.error('Failed to optimize database:', err)
      alert('فشل في تحسين قاعدة البيانات')
    }
  }

  useEffect(() => {
    fetchMetrics()

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number; critical: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number; critical: number }) => {
    if (value <= thresholds.good) return 'ممتاز'
    if (value <= thresholds.warning) return 'جيد'
    if (value <= thresholds.critical) return 'يحتاج تحسين'
    return 'حرج'
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

  const getEffortText = (effort: string) => {
    const texts = {
      'low': 'سهل',
      'medium': 'متوسط',
      'high': 'صعب'
    }
    return texts[effort as keyof typeof texts] || effort
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'dismissed': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      'pending': 'معلق',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'dismissed': 'مرفوض'
    }
    return texts[status as keyof typeof texts] || status
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل مقاييس الأداء...</span>
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
            <Button onClick={fetchMetrics} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد مقاييس أداء</p>
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
            <Zap className="w-6 h-6 text-yellow-600" />
            محسن الأداء
          </h1>
          <p className="text-gray-600">
            مراقبة وتحسين أداء النظام
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            className="flex items-center gap-1"
          >
            <Database className="w-4 h-4" />
            مسح الذاكرة
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={optimizeDatabase}
            className="flex items-center gap-1"
          >
            <Database className="w-4 h-4" />
            تحسين قاعدة البيانات
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">استجابة API</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(metrics.application.api_response_time, { good: 200, warning: 500, critical: 1000 })}`}>
                  {metrics.application.api_response_time}ms
                </p>
                <p className="text-xs text-gray-500">
                  {getPerformanceStatus(metrics.application.api_response_time, { good: 200, warning: 500, critical: 1000 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Network className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">استخدام الذاكرة</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(metrics.server.memory_usage, { good: 60, warning: 80, critical: 90 })}`}>
                  {metrics.server.memory_usage}%
                </p>
                <p className="text-xs text-gray-500">
                  {getPerformanceStatus(metrics.server.memory_usage, { good: 60, warning: 80, critical: 90 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Memory className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">استخدام CPU</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(metrics.server.cpu_usage, { good: 50, warning: 70, critical: 85 })}`}>
                  {metrics.server.cpu_usage}%
                </p>
                <p className="text-xs text-gray-500">
                  {getPerformanceStatus(metrics.server.cpu_usage, { good: 50, warning: 70, critical: 85 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Cpu className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              قاعدة البيانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">وقت الاستعلام</span>
                <span className={`font-medium ${getPerformanceColor(metrics.database.query_time, { good: 100, warning: 300, critical: 500 })}`}>
                  {metrics.database.query_time}ms
                </span>
              </div>
              <Progress 
                value={Math.min(100, (metrics.database.query_time / 500) * 100)} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">نسبة ضربات الذاكرة المؤقتة</span>
                <span className={`font-medium ${getPerformanceColor(100 - metrics.database.cache_hit_ratio, { good: 20, warning: 40, critical: 60 })}`}>
                  {metrics.database.cache_hit_ratio}%
                </span>
              </div>
              <Progress value={metrics.database.cache_hit_ratio} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الاستعلامات البطيئة</span>
                <span className="font-medium text-red-600">
                  {metrics.database.slow_queries}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">إجمالي الاستعلامات</span>
                <span className="font-medium text-gray-900">
                  {metrics.database.total_queries}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              الخادم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">استخدام القرص</span>
                <span className={`font-medium ${getPerformanceColor(metrics.server.disk_usage, { good: 70, warning: 85, critical: 95 })}`}>
                  {metrics.server.disk_usage}%
                </span>
              </div>
              <Progress value={metrics.server.disk_usage} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">شبكة I/O</span>
                <span className="font-medium text-gray-900">
                  {metrics.server.network_io} MB/s
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">وقت الاستجابة</span>
                <span className={`font-medium ${getPerformanceColor(metrics.server.response_time, { good: 100, warning: 300, critical: 500 })}`}>
                  {metrics.server.response_time}ms
                </span>
              </div>
              <Progress 
                value={Math.min(100, (metrics.server.response_time / 500) * 100)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            التطبيق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.application.page_load_time}ms</p>
              <p className="text-sm text-gray-600">وقت تحميل الصفحة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.application.error_rate}%</p>
              <p className="text-sm text-gray-600">معدل الأخطاء</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{metrics.application.active_users}</p>
              <p className="text-sm text-gray-600">المستخدمين النشطين</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.application.cache_efficiency}%</p>
              <p className="text-sm text-gray-600">كفاءة الذاكرة المؤقتة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            توصيات التحسين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recommendations
              .filter(rec => rec.status !== 'dismissed')
              .map((recommendation) => (
                <div key={recommendation.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {getPriorityText(recommendation.priority)}
                        </Badge>
                        <Badge className={getStatusColor(recommendation.status)}>
                          {getStatusText(recommendation.status)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>التأثير: {recommendation.impact}</span>
                        <span>الجهد: {getEffortText(recommendation.effort)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {recommendation.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => applyOptimization(recommendation.id)}
                          className="flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          تطبيق
                        </Button>
                      )}
                      {recommendation.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="flex items-center gap-1"
                        >
                          <Pause className="w-3 h-3" />
                          قيد التنفيذ
                        </Button>
                      )}
                      {recommendation.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          مكتمل
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissRecommendation(recommendation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          
          {metrics.recommendations.filter(rec => rec.status !== 'dismissed').length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد توصيات</p>
              <p className="text-sm text-gray-400 mt-2">النظام يعمل بأفضل أداء</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceOptimizer
