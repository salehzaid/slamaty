import React, { useState, useEffect } from 'react'
import { Download, Filter, Calendar, BarChart3, PieChart, TrendingUp, FileText, Building2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Area,
  AreaChart,
  Legend
} from 'recharts'
import { apiClient } from '@/lib/api'

const COLORS = {
  primary: '#ad63f4',
  success: '#3fc183',
  warning: '#f6c45d',
  danger: '#f43f5e',
  purple: '#cfa1ff',
  indigo: '#8cc8ff',
  pink: '#f7b2d9',
  teal: '#63d3c6'
}

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

      // Set the data (support APIs that return either { data: ... } or raw object)
      setDashboardStats(statsResponse?.data || statsResponse || null)
      setComplianceTrends((trendsResponse?.data as any)?.trends || (trendsResponse as any)?.trends || [])
      setDepartmentPerformance((deptResponse?.data as any)?.departments || (deptResponse as any)?.departments || [])
      setRoundsByType((roundsTypeResponse?.data as any)?.round_types || (roundsTypeResponse as any)?.round_types || [])
      setCapaStatusDistribution((capaStatusResponse?.data as any)?.capa_status || (capaStatusResponse as any)?.capa_status || [])
      setMonthlyRounds((monthlyResponse?.data as any)?.monthly_rounds || (monthlyResponse as any)?.monthly_rounds || [])

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

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
              {entry.dataKey === 'compliance' && '%'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff] min-h-screen">
      {/* Header with Animation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2 rounded-xl shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            التقارير والتحليلات
          </h1>
          <p className="text-slate-600 mr-14">تقارير شاملة وتحليلات أداء النظام في الوقت الفعلي</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 hover:bg-primary-50 transition-colors"
            onClick={loadReportsData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" className="flex items-center gap-2 hover:bg-primary-50 transition-colors">
            <Filter className="w-4 h-4" />
            فلترة
          </Button>
          <Button className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all shadow-md">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-500" />
                الفترة الزمنية
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all bg-white hover:border-primary-200"
                disabled={loading}
              >
                <option value="1">الشهر الماضي</option>
                <option value="3">الـ 3 أشهر الماضية</option>
                <option value="6">الـ 6 أشهر الماضية</option>
                <option value="12">السنة الماضية</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary-500" />
                القسم
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all bg-white hover:border-primary-200"
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

      {/* Loading State with Animation */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-pulse"></div>
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-slate-600 font-medium animate-pulse">جاري تحميل البيانات...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-2 border-danger-200 bg-gradient-to-br from-danger-50 to-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-danger-900 mb-1">حدث خطأ</h3>
                <p className="text-danger-700">{error}</p>
                <Button 
                  onClick={loadReportsData} 
                  className="mt-3 bg-danger-500 hover:bg-danger-600 text-white"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      {!loading && !error && dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Compliance Rate Card */}
          <Card className="bg-gradient-to-br from-emerald-100 to-emerald-50 text-slate-900 border border-emerald-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/70 p-3 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <Badge className="bg-white/70 text-emerald-700 border-0">متوسط</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">معدل الامتثال</p>
                <p className="text-4xl font-bold mb-2 text-slate-900">{dashboardStats.compliance_rate || 0}%</p>
                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  من جميع الجولات المكتملة
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Rounds Card */}
          <Card className="bg-gradient-to-br from-primary-100 to-primary-50 text-slate-900 border border-primary-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/70 p-3 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <Badge className="bg-white/70 text-primary-700 border-0">
                  {dashboardStats.rounds?.completed || 0} مكتملة
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700 mb-1">إجمالي الجولات</p>
                <p className="text-4xl font-bold mb-2 text-slate-900">{dashboardStats.rounds?.total || 0}</p>
                <p className="text-xs text-primary-700">
                  {dashboardStats.rounds?.overdue || 0} متأخرة • {dashboardStats.rounds?.in_progress || 0} قيد التنفيذ
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* CAPAs Card */}
          <Card className="bg-gradient-to-br from-amber-100 to-amber-50 text-slate-900 border border-amber-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/70 p-3 rounded-xl backdrop-blur-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <Badge className="bg-white/70 text-amber-700 border-0">
                  {dashboardStats.capas?.in_progress || 0} نشطة
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">الخطط التصحيحية</p>
                <p className="text-4xl font-bold mb-2 text-slate-900">{dashboardStats.capas?.total || 0}</p>
                <p className="text-xs text-amber-700">
                  {dashboardStats.capas?.pending || 0} معلقة • {dashboardStats.capas?.implemented || 0} منفذة
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Departments Card */}
          <Card className="bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 text-slate-900 border border-fuchsia-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/70 p-3 rounded-xl backdrop-blur-sm">
                  <Building2 className="w-6 h-6" />
                </div>
                <Badge className="bg-white/70 text-fuchsia-700 border-0">نشطة</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-fuchsia-700 mb-1">الأقسام</p>
                <p className="text-4xl font-bold mb-2 text-slate-900">{dashboardStats.departments?.active || 0}</p>
                <p className="text-xs text-fuchsia-700">
                  من أصل {dashboardStats.departments?.total || 0} قسم
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Trends */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                اتجاهات الامتثال
              </CardTitle>
              <CardDescription>متوسط معدل الامتثال عبر الشهور</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[320px]">
                {complianceTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={complianceTrends}>
                      <defs>
                        <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="compliance"
                        stroke={COLORS.success}
                        strokeWidth={3}
                        fill="url(#colorCompliance)"
                        name="معدل الامتثال"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <BarChart3 className="w-16 h-16 mb-3 opacity-50" />
                    <p className="font-medium">لا توجد بيانات متاحة</p>
                    <p className="text-sm text-center mt-1">لم يتم العثور على بيانات الامتثال للفترة المحددة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rounds by Type */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-accent-50 border-b">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <PieChart className="w-5 h-5 text-primary-600" />
                </div>
                توزيع الجولات حسب النوع
              </CardTitle>
              <CardDescription>نسبة كل نوع من الجولات</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[320px]">
                {roundsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={roundsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {roundsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <PieChart className="w-16 h-16 mb-3 opacity-50" />
                    <p className="font-medium">لا توجد بيانات متاحة</p>
                    <p className="text-sm text-center mt-1">لم يتم العثور على بيانات الجولات للفترة المحددة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Performance */}
      {!loading && !error && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="bg-fuchsia-100 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-fuchsia-600" />
              </div>
              أداء الأقسام
            </CardTitle>
            <CardDescription>معدل الامتثال لكل قسم</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[400px]">
              {departmentPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="compliance" 
                      fill={COLORS.primary} 
                      radius={[0, 8, 8, 0]}
                      name="معدل الامتثال"
                    >
                      {departmentPerformance.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.compliance >= 90 ? COLORS.success : entry.compliance >= 70 ? COLORS.warning : COLORS.danger} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Building2 className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-medium">لا توجد بيانات متاحة</p>
                  <p className="text-sm text-center mt-1">لم يتم العثور على بيانات أداء الأقسام</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Rounds */}
      {!loading && !error && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              الجولات الشهرية
            </CardTitle>
            <CardDescription>إحصائيات الجولات حسب الحالة لكل شهر</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[400px]">
              {monthlyRounds.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRounds}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      iconType="circle"
                    />
                    <Bar dataKey="scheduled" stackId="a" fill={COLORS.primary} name="مجدولة" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="completed" stackId="a" fill={COLORS.success} name="مكتملة" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="overdue" stackId="a" fill={COLORS.danger} name="متأخرة" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Calendar className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-medium">لا توجد بيانات متاحة</p>
                  <p className="text-sm text-center mt-1">لم يتم العثور على بيانات الجولات الشهرية</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CAPA Status Distribution */}
      {!loading && !error && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100 border-b">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="bg-rose-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-rose-600" />
              </div>
              توزيع الخطط التصحيحية
            </CardTitle>
            <CardDescription>حالات الخطط التصحيحية (CAPA)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px]">
              {capaStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={capaStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {capaStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <FileText className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-medium">لا توجد بيانات متاحة</p>
                  <p className="text-sm text-center mt-1">لم يتم العثور على بيانات الخطط التصحيحية</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card className="shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-600" />
            تصدير التقارير
          </CardTitle>
          <CardDescription>قم بتصدير التقارير بصيغ مختلفة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleExportReport('compliance')}
              className="flex items-center justify-center gap-2 h-20 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
            >
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-1 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">تقرير الامتثال</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport('rounds')}
              className="flex items-center justify-center gap-2 h-20 hover:bg-primary-50 hover:border-primary-300 transition-all group"
            >
              <div className="text-center">
                <BarChart3 className="w-6 h-6 mx-auto mb-1 text-primary-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">تقرير الجولات</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport('capa')}
              className="flex items-center justify-center gap-2 h-20 hover:bg-amber-50 hover:border-amber-300 transition-all group"
            >
              <div className="text-center">
                <FileText className="w-6 h-6 mx-auto mb-1 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">تقرير الخطط التصحيحية</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportsPage
