import React, { useState } from 'react'
import { Download, Filter, Calendar, BarChart3, PieChart, TrendingUp, FileText, Users, Building2 } from 'lucide-react'
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

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  // Mock data for reports
  const complianceTrends = [
    { month: 'يناير', compliance: 85, rounds: 12 },
    { month: 'فبراير', compliance: 88, rounds: 15 },
    { month: 'مارس', compliance: 92, rounds: 18 },
    { month: 'أبريل', compliance: 89, rounds: 14 },
    { month: 'مايو', compliance: 94, rounds: 16 },
    { month: 'يونيو', compliance: 96, rounds: 20 },
  ]

  const departmentPerformance = [
    { name: 'قسم الطوارئ', compliance: 92, rounds: 8, capa: 3 },
    { name: 'العناية المركزة', compliance: 87, rounds: 6, capa: 5 },
    { name: 'قسم الجراحة', compliance: 95, rounds: 5, capa: 2 },
    { name: 'قسم الأطفال', compliance: 89, rounds: 7, capa: 4 },
    { name: 'قسم الباطنية', compliance: 91, rounds: 4, capa: 1 },
  ]

  const roundsByType = [
    { name: 'سلامة المرضى', value: 8, color: '#3b82f6' },
    { name: 'مكافحة العدوى', value: 6, color: '#ef4444' },
    { name: 'النظافة', value: 5, color: '#10b981' },
    { name: 'سلامة الأدوية', value: 4, color: '#f59e0b' },
    { name: 'سلامة المعدات', value: 3, color: '#8b5cf6' },
  ]

  const capaStatusDistribution = [
    { name: 'منفذة', value: 7, color: '#10b981' },
    { name: 'قيد التنفيذ', value: 3, color: '#3b82f6' },
    { name: 'معلقة', value: 2, color: '#f59e0b' },
    { name: 'متأخرة', value: 1, color: '#ef4444' },
  ]

  const monthlyRounds = [
    { month: 'يناير', scheduled: 12, completed: 10, overdue: 2 },
    { month: 'فبراير', scheduled: 15, completed: 14, overdue: 1 },
    { month: 'مارس', scheduled: 18, completed: 16, overdue: 2 },
    { month: 'أبريل', scheduled: 14, completed: 13, overdue: 1 },
    { month: 'مايو', scheduled: 16, completed: 15, overdue: 1 },
    { month: 'يونيو', scheduled: 20, completed: 18, overdue: 2 },
  ]

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
              >
                <option value="week">الأسبوع الماضي</option>
                <option value="month">الشهر الماضي</option>
                <option value="quarter">الربع الماضي</option>
                <option value="year">السنة الماضية</option>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل الامتثال</p>
                <p className="text-2xl font-bold text-green-600">94.2%</p>
                <p className="text-xs text-green-600">+2.3% من الشهر الماضي</p>
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
                <p className="text-2xl font-bold text-blue-600">156</p>
                <p className="text-xs text-blue-600">+12% من الشهر الماضي</p>
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
                <p className="text-2xl font-bold text-orange-600">23</p>
                <p className="text-xs text-orange-600">5 مفتوحة</p>
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
                <p className="text-2xl font-bold text-purple-600">12</p>
                <p className="text-xs text-purple-600">من أصل 12</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            أداء الأقسام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Monthly Rounds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            الجولات الشهرية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
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
          </div>
        </CardContent>
      </Card>

      {/* CAPA Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            توزيع الخطط التصحيحية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
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
          </div>
        </CardContent>
      </Card>

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
