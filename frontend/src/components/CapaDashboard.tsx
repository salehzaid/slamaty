import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  Calendar, 
  User, 
  Filter, 
  Search, 
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Play
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CapaData {
  id: number
  title: string
  description: string
  department: string
  priority: string
  status: string
  verification_status: string
  severity: number
  target_date: string
  escalation_level: number
  corrective_actions: Array<{
    task: string
    due_date?: string
    assigned_to_id?: number
    status: string
    completed_at?: string
  }>
  preventive_actions: Array<{
    task: string
    due_date?: string
    assigned_to_id?: number
    status: string
    completed_at?: string
  }>
  verification_steps: Array<{
    step: string
    required: boolean
    completed: boolean
    completed_at?: string
  }>
  created_at: string
  assigned_to?: string
  estimated_cost?: number
  sla_days: number
}

interface CapaDashboardProps {
  capas: CapaData[]
  onViewCapa?: (capa: CapaData) => void
  onEditCapa?: (capa: CapaData) => void
  onCreateCapa?: () => void
  onStartCapa?: (capa: CapaData) => void
  isLoading?: boolean
}

const CapaDashboard: React.FC<CapaDashboardProps> = ({
  capas = [],
  onViewCapa,
  onEditCapa,
  onCreateCapa,
  onStartCapa,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('all')

  // Get unique departments for filter
  const departments = Array.from(new Set(capas.map(capa => capa.department)))

  // Filter capas based on search and filters
  const filteredCapas = capas.filter(capa => {
    const matchesSearch = capa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         capa.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = !departmentFilter || departmentFilter === 'all' || capa.department === departmentFilter
    const matchesStatus = !statusFilter || statusFilter === 'all' || capa.status === statusFilter
    const matchesSeverity = !severityFilter || severityFilter === 'all' || capa.severity.toString() === severityFilter
    const matchesVerificationStatus = !verificationStatusFilter || verificationStatusFilter === 'all' || capa.verification_status === verificationStatusFilter

    return matchesSearch && matchesDepartment && matchesStatus && matchesSeverity && matchesVerificationStatus
  })

  // Calculate statistics
  const stats = {
    total: capas.length,
    pending: capas.filter(c => c.verification_status === 'pending').length,
    in_review: capas.filter(c => c.verification_status === 'in_review').length,
    verified: capas.filter(c => c.verification_status === 'verified').length,
    rejected: capas.filter(c => c.verification_status === 'rejected').length,
    overdue: capas.filter(c => new Date(c.target_date) < new Date() && c.verification_status !== 'verified').length,
    escalated: capas.filter(c => c.escalation_level > 0).length,
    avgSeverity: capas.length > 0 ? (capas.reduce((sum, c) => sum + c.severity, 0) / capas.length).toFixed(1) : 0
  }

  // Calculate progress for each CAPA
  const calculateProgress = (capa: CapaData) => {
    const totalActions = capa.corrective_actions.length + capa.preventive_actions.length
    const completedActions = capa.corrective_actions.filter(a => a.status === 'completed').length +
                           capa.preventive_actions.filter(a => a.status === 'completed').length
    
    return totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0
  }

  // Get severity color and label
  const getSeverityInfo = (severity: number) => {
    const severityMap = {
      1: { label: 'منخفض', color: 'bg-green-100 text-green-800' },
      2: { label: 'متوسط منخفض', color: 'bg-yellow-100 text-yellow-800' },
      3: { label: 'متوسط', color: 'bg-orange-100 text-orange-800' },
      4: { label: 'عالي', color: 'bg-red-100 text-red-800' },
      5: { label: 'حرج', color: 'bg-red-200 text-red-900' }
    }
    return severityMap[severity as keyof typeof severityMap] || { label: 'غير محدد', color: 'bg-gray-100 text-gray-800' }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_review': 'bg-blue-100 text-blue-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'closed': 'bg-gray-100 text-gray-800'
    }
    return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800'
  }

  // Prepare data for charts
  const severityData = [
    { name: 'منخفض', value: capas.filter(c => c.severity === 1).length, color: '#10b981' },
    { name: 'متوسط منخفض', value: capas.filter(c => c.severity === 2).length, color: '#f59e0b' },
    { name: 'متوسط', value: capas.filter(c => c.severity === 3).length, color: '#f97316' },
    { name: 'عالي', value: capas.filter(c => c.severity === 4).length, color: '#ef4444' },
    { name: 'حرج', value: capas.filter(c => c.severity === 5).length, color: '#dc2626' }
  ]

  const statusData = [
    { name: 'معلق', value: stats.pending, color: '#f59e0b' },
    { name: 'قيد المراجعة', value: stats.in_review, color: '#3b82f6' },
    { name: 'متحقق', value: stats.verified, color: '#10b981' },
    { name: 'مرفوض', value: stats.rejected, color: '#ef4444' }
  ]

  // const departmentData = departments.map(dept => ({
  //   name: dept,
  //   value: capas.filter(c => c.department === dept).length
  // }))

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-8 h-8" />
            لوحة إدارة الخطط التصحيحية
          </h1>
          <p className="text-gray-600 mt-2">إدارة ومتابعة الخطط التصحيحية والوقائية</p>
        </div>
        <Button onClick={onCreateCapa} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إنشاء خطة جديدة
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخطط</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معلق</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متحقق</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متأخر</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>توزيع مستوى الخطورة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            الفلاتر والبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث في الخطط..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">القسم</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="in_review">قيد المراجعة</SelectItem>
                  <SelectItem value="verified">متحقق</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">مستوى الخطورة</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستويات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="1">منخفض</SelectItem>
                  <SelectItem value="2">متوسط منخفض</SelectItem>
                  <SelectItem value="3">متوسط</SelectItem>
                  <SelectItem value="4">عالي</SelectItem>
                  <SelectItem value="5">حرج</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">حالة التحقق</label>
              <Select value={verificationStatusFilter} onValueChange={setVerificationStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="in_review">قيد المراجعة</SelectItem>
                  <SelectItem value="verified">متحقق</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CAPA List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">قائمة الخطط التصحيحية ({filteredCapas.length})</h2>
        
        {filteredCapas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد خطط تصحيحية تطابق المعايير المحددة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCapas.map((capa) => {
              const progress = calculateProgress(capa)
              const severityInfo = getSeverityInfo(capa.severity)
              const isOverdue = new Date(capa.target_date) < new Date() && capa.verification_status !== 'verified'
              
              return (
                <Card key={capa.id} className={`${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{capa.title}</h3>
                          <Badge className={getStatusColor(capa.verification_status)}>
                            {capa.verification_status}
                          </Badge>
                          <Badge className={severityInfo.color}>
                            {capa.severity} - {severityInfo.label}
                          </Badge>
                          {capa.escalation_level > 0 && (
                            <Badge variant="destructive">
                              تصعيد {capa.escalation_level}
                            </Badge>
                          )}
                          {isOverdue && (
                            <Badge variant="destructive">
                              متأخر
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">{capa.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">القسم:</span>
                            <span className="text-sm font-medium">{capa.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">الموعد المستهدف:</span>
                            <span className="text-sm font-medium">{new Date(capa.target_date).toLocaleDateString('en-US')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">التقدم:</span>
                            <span className="text-sm font-medium">{progress}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">مهلة الحل:</span>
                            <span className="text-sm font-medium">{capa.sla_days} يوم</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>التقدم</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewCapa?.(capa)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          عرض
                        </Button>
                        {(capa.status === 'pending' || capa.status === 'assigned' || capa.verification_status === 'pending') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStartCapa?.(capa)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            title="بدء الخطة التصحيحية"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            بدء
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditCapa?.(capa)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          تعديل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CapaDashboard
