import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Clock, CheckCircle2, AlertTriangle, Play, Pause, MoreHorizontal, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/context/AuthContext'
import { useMyRounds } from '@/hooks/useRounds'
import { apiClient } from '@/lib/api'
import CapaForm from '@/components/forms/CapaForm'
import { CapaCreateForm } from '@/lib/validations'
import { useCapas } from '@/hooks/useCapas'
import { useNavigate, useLocation } from 'react-router-dom'

const MyRoundsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const { user } = useAuth()
  const { data: myRounds, loading, error, refetch } = useMyRounds()

  const [showCapaForm, setShowCapaForm] = useState(false)
  const [capaInitialData, setCapaInitialData] = useState<Partial<CapaCreateForm> | null>(null)
  const [createdCapaInfo, setCreatedCapaInfo] = useState<{ id: number | null, roundId?: number | null } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { data: capas } = useCapas()
  const navigate = useNavigate()
  const location = useLocation()

  // Handle success messages from evaluation page
  useEffect(() => {
    if (location.state) {
      const state = location.state as any
      if (state.message) {
        setSuccessMessage(state.message)
        
        // Clear message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null)
          // Clear location state to prevent message from showing again on refresh
          navigate(location.pathname, { replace: true, state: {} })
        }, 5000)
      }
    }
  }, [location.state, navigate, location.pathname])

  const handleStartRound = (roundId: number) => {
    // Navigate to evaluation page instead of opening modal
    navigate(`/rounds/evaluate/${roundId}`)
  }

  // Evaluation is now handled in EvaluateRoundPage

  const handleCapaSubmit = async (data: any) => {
    try {
      if (!data) return
      // Map frontend keys to backend expected keys
      const payload = {
        title: data.title,
        description: data.description,
        round_id: data.roundId || data.roundId === 0 ? data.roundId : undefined,
        department: data.department,
        priority: data.priority,
        assigned_to: data.assignedTo,
        target_date: data.targetDate ? new Date(data.targetDate).toISOString() : null,
        risk_score: data.riskScore
      }
      await apiClient.createCapa(payload)
      setShowCapaForm(false)
      setSelectedRoundId(null)
      setCapaInitialData(null)
      alert('تم إنشاء الخطة التصحيحية وحفظها في النظام')
    } catch (err) {
      console.error('Error creating CAPA:', err)
      alert('حدث خطأ أثناء إنشاء الخطة التصحيحية')
    }
  }

  const handleCompleteRound = (roundId: number) => {
    // Open the evaluation page so the user can complete all items and then finalize
    navigate(`/rounds/evaluate/${roundId}`, { state: { from: location.pathname } })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'scheduled': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      'completed': 'مكتملة',
      'in_progress': 'قيد التنفيذ',
      'scheduled': 'مجدولة',
      'overdue': 'متأخرة',
      'cancelled': 'ملغية',
    }
    return texts[status as keyof typeof texts] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityText = (priority: string) => {
    const texts = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة',
    }
    return texts[priority as keyof typeof texts] || priority
  }

  const getRoundTypeText = (type: string) => {
    const texts = {
      'patient_safety': 'سلامة المرضى',
      'infection_control': 'مكافحة العدوى',
      'hygiene': 'النظافة',
      'medication_safety': 'سلامة الأدوية',
      'equipment_safety': 'سلامة المعدات',
      'environmental': 'البيئة',
      'general': 'عام',
    }
    return texts[type as keyof typeof texts] || type
  }

  const filteredRounds = myRounds?.filter(round => {
    const matchesSearch = round.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         round.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || round.status === filterStatus
    const matchesPriority = filterPriority === 'all' || round.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  }) || []

  const getProgressPercentage = (status: string) => {
    const progress = {
      'scheduled': 0,
      'in_progress': 50,
      'completed': 100,
      'overdue': 0,
      'cancelled': 0,
    }
    return progress[status as keyof typeof progress] || 0
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الجولات...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg mb-4">خطأ في تحميل البيانات</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetch} className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="p-6 space-y-8">
        
        {/* Success Message Banner */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">جولاتي</h1>
                <p className="text-lg text-gray-600">الجولات المكلف بها {user?.first_name} {user?.last_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">إجمالي الجولات</p>
                  <p className="text-3xl font-bold">{myRounds?.length || 0}</p>
                </div>
                <Users className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">مكتملة</p>
                  <p className="text-3xl font-bold">
                    {myRounds?.filter(r => r.status === 'completed').length || 0}
                  </p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">قيد التنفيذ</p>
                  <p className="text-3xl font-bold">
                    {myRounds?.filter(r => r.status === 'in_progress').length || 0}
                  </p>
                </div>
                <Play className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">متأخرة</p>
                  <p className="text-3xl font-bold">
                    {myRounds?.filter(r => r.status === 'overdue').length || 0}
                  </p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Filter className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">فلاتر البحث</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="البحث في الجولات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 h-14 text-lg border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 h-14 text-lg"
              >
                <option value="all">جميع الحالات</option>
                <option value="scheduled">مجدولة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
                <option value="overdue">متأخرة</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 h-14 text-lg"
              >
                <option value="all">جميع الأولويات</option>
                <option value="urgent">عاجلة</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Rounds Grid - Ticket Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRounds.map((round) => (
            <div key={round.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Ticket Header */}
              <div className={`text-white p-3 ${
                round.status === 'completed' 
                  ? 'bg-gradient-to-r from-green-600 to-green-700'
                  : round.status === 'in_progress'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                  : round.status === 'scheduled'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                  : 'bg-gradient-to-r from-red-600 to-red-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{round.department}</h3>
                      <p className="text-blue-100 text-xs">{round.roundCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(round.status)}`}>
                      {getStatusText(round.status)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Ticket Content */}
              <div className="p-4">
                <div className="mb-3">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">{round.title}</h4>
                  {round.description && (
                    <p className="text-gray-600 text-xs line-clamp-1">{round.description}</p>
                  )}
                </div>
                
                {/* Flight Details Style */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {new Date(round.scheduledDate).toLocaleDateString('en-US', { 
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(round.scheduledDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">تاريخ الجولة</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-bold px-3 py-2 rounded-lg ${
                      round.priority === 'urgent' 
                        ? 'bg-red-100 text-red-800'
                        : round.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : round.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getRoundTypeText(round.roundType)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                      round.priority === 'urgent' 
                        ? 'bg-red-200 text-red-700'
                        : round.priority === 'high'
                        ? 'bg-orange-200 text-orange-700'
                        : round.priority === 'medium'
                        ? 'bg-yellow-200 text-yellow-700'
                        : 'bg-green-200 text-green-700'
                    }`}>
                      {getPriorityText(round.priority)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">نوع الجولة</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">التقدم</span>
                    <span className="font-bold text-blue-600">{getProgressPercentage(round.status)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(round.status)} className="h-2" />
                </div>

                {/* Compliance */}
                {round.compliancePercentage > 0 && (
                  <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 font-medium text-sm">الامتثال: {round.compliancePercentage}%</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-3 border-t border-gray-200">
                  {round.status === 'scheduled' && (
                    <Button
                      onClick={() => handleStartRound(round.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <Play className="w-4 h-4" />
                      بدء الجولة
                    </Button>
                  )}
                  {round.status === 'in_progress' && (
                    <Button
                      onClick={() => handleCompleteRound(round.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      إكمال الجولة
                    </Button>
                  )}
                  {round.status === 'completed' && (
                    <Button
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      مكتملة
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Evaluation form is now a separate page */}

        {/* Notification banner for created CAPA */}
        {createdCapaInfo && (
          <div className="fixed top-6 right-6 z-50">
            <div className="bg-white shadow-lg rounded-lg p-4 flex items-center gap-4">
              <div className="text-sm">
                <div className="font-medium">تم إنشاء خطة تصحيحية تلقائياً</div>
                <div className="text-xs text-gray-600">CAPA ID: {createdCapaInfo.id || '—'}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => navigate(`/capa?roundId=${createdCapaInfo.roundId || ''}`)}>عرض الخطة</button>
                <button className="px-3 py-2 border rounded" onClick={() => setCreatedCapaInfo(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        )}

        {showCapaForm && capaInitialData && (
          <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
            <div className="w-full max-w-4xl">
              <CapaForm
                initialData={capaInitialData}
                onCancel={() => { setShowCapaForm(false); setCapaInitialData(null); setSelectedRoundId(null) }}
                onSubmit={handleCapaSubmit}
              />
            </div>
          </div>
        )}

        {filteredRounds.length === 0 && (
          <Card className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-16 text-center">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <Users className="w-16 h-16 text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' ? 'لا توجد نتائج' : 'لا توجد جولات مكلف بها'}
              </h3>
              <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                  ? 'جرب تغيير معايير البحث أو الفلترة للعثور على الجولات المطلوبة'
                  : 'لم يتم تكليفك بأي جولات تقييم حالياً'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MyRoundsPage
