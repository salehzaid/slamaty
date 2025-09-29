import React, { useState, useEffect } from 'react'
import { Download, Filter, Calendar, BarChart3, PieChart, TrendingUp, FileText, Users, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { apiClient } from '@/lib/api'

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for real data
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [complianceTrends, setComplianceTrends] = useState<any[]>([])
  const [departmentPerformance, setDepartmentPerformance] = useState<any[]>([])
  const [roundsByType, setRoundsByType] = useState<any[]>([])
  const [capaStatusDistribution, setCapaStatusDistribution] = useState<any[]>([])
  const [monthlyRounds, setMonthlyRounds] = useState<any[]>([])

  // Load data from API
  useEffect(() => {
    loadReportsData()
  }, [selectedPeriod])

  const loadReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const months = parseInt(selectedPeriod)
      
      // Load all reports data in parallel
      const [
        statsResponse,
        trendsResponse,
        deptResponse,
        roundsTypeResponse,
        capaStatusResponse,
        monthlyResponse
      ] = await Promise.all([
        apiClient.getReportsDashboardStats(),
        apiClient.getComplianceTrends(months),
        apiClient.getDepartmentPerformance(),
        apiClient.getRoundsByType(),
        apiClient.getCapaStatusDistribution(),
        apiClient.getMonthlyRounds(months)
      ])

      // Set the data
      setDashboardStats(statsResponse.data)
      setComplianceTrends(trendsResponse.data.trends || [])
      setDepartmentPerformance(deptResponse.data.departments || [])
      setRoundsByType(roundsTypeResponse.data.round_types || [])
      setCapaStatusDistribution(capaStatusResponse.data.capa_status || [])
      setMonthlyRounds(monthlyResponse.data.monthly_rounds || [])

    } catch (err) {
      console.error('Error loading reports data:', err)
      setError('حدث خطأ في تحميل بيانات التقارير')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = (type: string) => {
    console.log(`Exporting ${type} report`)
    // Here you would implement the actual export functionality
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            التقارير والتحليلات
          </h1>
          <p className="text-gray-600">تقارير شاملة وتحليلات أداء النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            فلترة
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير تقرير
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفترة الزمنية
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="1">الشهر الماضي</option>
                <option value="3">الـ 3 أشهر الماضية</option>
                <option value="6">الـ 6 أشهر الماضية</option>
                <option value="12">السنة الماضية</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                القسم
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأقسام</option>
                <option value="emergency">قسم الطوارئ</option>
                <option value="icu">العناية المركزة</option>
                <option value="surgery">قسم الجراحة</option>
                <option value="pediatrics">قسم الأطفال</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="mr-2 text-gray-600">جاري تحميل البيانات...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-600">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
            <Button 
              onClick={loadReportsData} 
              className="mt-2"
              variant="outline"
              size="sm"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {!loading && !error && dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">معدل الامتثال</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardStats.compliance_rate || 0}%</p>
                  <p className="text-xs text-green-600">متوسط جميع الجولات المكتملة</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الجولات</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardStats.rounds?.total || 0}</p>
                  <p className="text-xs text-blue-600">
                    {dashboardStats.rounds?.completed || 0} مكتملة، {dashboardStats.rounds?.overdue || 0} متأخرة
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الخطط التصحيحية</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboardStats.capas?.total || 0}</p>
                  <p className="text-xs text-orange-600">
                    {dashboardStats.capas?.pending || 0} معلقة، {dashboardStats.capas?.in_progress || 0} قيد التنفيذ
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الأقسام النشطة</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboardStats.departments?.active || 0}</p>
                  <p className="text-xs text-purple-600">من أصل {dashboardStats.departments?.total || 0}</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                اتجاهات الامتثال
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {complianceTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={complianceTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="compliance"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    لا توجد بيانات متاحة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rounds by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                توزيع الجولات حسب النوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {roundsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={roundsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {roundsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    لا توجد بيانات متاحة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Performance */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              أداء الأقسام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {departmentPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'معدل الامتثال']}
                      labelFormatter={(label) => `القسم: ${label}`}
                    />
                    <Bar dataKey="compliance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  لا توجد بيانات متاحة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Rounds */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              الجولات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {monthlyRounds.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRounds}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="scheduled" stackId="a" fill="#3b82f6" name="مجدولة" />
                    <Bar dataKey="completed" stackId="a" fill="#10b981" name="مكتملة" />
                    <Bar dataKey="overdue" stackId="a" fill="#ef4444" name="متأخرة" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  لا توجد بيانات متاحة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CAPA Status Distribution */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              توزيع الخطط التصحيحية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {capaStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={capaStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {capaStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  لا توجد بيانات متاحة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>تصدير التقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleExportReport('compliance')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تقرير الامتثال
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport('rounds')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تقرير الجولات
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport('capa')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تقرير الخطط التصحيحية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportsPage
