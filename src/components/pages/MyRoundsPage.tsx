import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, CheckCircle2, AlertTriangle, Play, Users, Building2, List, Grid, Target, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/context/AuthContext'
import { useMyRounds } from '@/hooks/useRounds'
import { apiClient } from '@/lib/api'
import CapaForm from '@/components/forms/CapaForm'
import { CapaCreateForm } from '@/lib/validations'
import { useNavigate, useLocation } from 'react-router-dom'
import RoundsTable from '@/components/ui/RoundsTable'
import StatsChart from '@/components/ui/StatsChart'

interface RoundStats {
  total: number
  completed: number
  in_progress: number
  overdue: number
  scheduled: number
  avg_completion: number
  avg_compliance: number
  high_priority: number
  needs_capa_count?: number
  open_capa_count?: number
}

const MyRoundsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const auth = useAuth()
  const user = auth?.user
  const { data: myRounds, loading, error, refetch } = useMyRounds()
  const [stats, setStats] = useState<RoundStats | null>(null)


  const [showCapaForm, setShowCapaForm] = useState(false)
  const [capaInitialData, setCapaInitialData] = useState<Partial<CapaCreateForm> | null>(null)
  const [createdCapaInfo, setCreatedCapaInfo] = useState<{ id: number | null, roundId?: number | null } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Helper to handle CAPA round ID
  const setSelectedRoundId = (_: number | null) => {
    // This is used in handleCapaSubmit
  }

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // setStatsLoading(true) - removed
        const response = await apiClient.getMyRoundsStats()
        setStats(response)
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        // setStatsLoading(false) - removed
      }
    }

    fetchStats()
  }, [myRounds]) // Re-fetch when rounds change

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

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    }
    return colors[(priority || '').toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, { ar: string; en: string }> = {
      completed: { ar: 'مكتملة', en: 'COMPLETED' },
      in_progress: { ar: 'قيد التنفيذ', en: 'IN_PROGRESS' },
      scheduled: { ar: 'مجدولة', en: 'SCHEDULED' },
      overdue: { ar: 'متأخرة', en: 'OVERDUE' },
      cancelled: { ar: 'ملغية', en: 'CANCELLED' },
    }
    const t = texts[(status || '').toLowerCase()] || { ar: status || '', en: '' }
    return (
      <span className="inline-flex items-center gap-2">
        <span>{t.ar}</span>
        {t.en && <span className="text-xs text-gray-400 font-mono">{t.en}</span>}
      </span>
    )
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
    const matchesSearch = (round.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (round.roundCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || round.status === filterStatus
    const matchesPriority = filterPriority === 'all' || round.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  }) || []

  const getProgressPercentage = (round: any) => {
    // Use completion_percentage if available, otherwise use status-based estimation
    if (round.completionPercentage !== undefined && round.completionPercentage !== null) {
      return round.completionPercentage
    }

    const progress = {
      'scheduled': 0,
      'in_progress': 50,
      'completed': 100,
      'overdue': 0,
      'cancelled': 0,
    }
    return progress[round.status as keyof typeof progress] || 0
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 bg-white p-2 rounded shadow">تخطي إلى المحتوى</a>
      <div id="main-content" className="p-6 space-y-8">

        {/* Success Message Banner */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}
        {/* Enhanced Header */}
        <div className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 p-8 sticky top-6 z-30 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-primary-50 rounded-lg">
                <User className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">جولاتي</h1>
                <p className="text-lg text-slate-600">عرض وإدارة الجولات المكلف بها {user?.first_name} {user?.last_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Optional: Add Refresh Button or similar */}
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex items-center gap-2"
              >
                تحديث البيانات
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards - Using StatsChart */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsChart
            title="معدل الإنجاز"
            value={stats?.avg_completion || 0}
            previousValue={0} // No trend data available in this API
            icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
            color="text-green-600"
            bgColor="bg-green-100"
            trend="stable" // Hide trend
            trendValue={0}

          />

          <StatsChart
            title="الجولات النشطة"
            value={stats?.in_progress || 0}
            previousValue={0}
            icon={<Play className="w-6 h-6 text-blue-600" />}
            color="text-blue-600"
            bgColor="bg-blue-100"
            trend="stable"
            trendValue={0}
          />

          <StatsChart
            title="الجولات المتأخرة"
            value={stats?.overdue || 0}
            previousValue={0}
            icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
            color="text-red-600"
            bgColor="bg-red-100"
            trend="stable"
            trendValue={0}
          />

          <StatsChart
            title="معدل الامتثال"
            value={stats?.avg_compliance || 0}
            previousValue={0}
            icon={<Target className="w-6 h-6 text-purple-600" />}
            color="text-purple-600"
            bgColor="bg-purple-100"
            trend="stable"
            trendValue={0}

          />
        </div>



        {/* View toggle: Cards / Table */}
        <div className="flex items-center justify-end gap-2">
          <button
            className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            aria-pressed={viewMode === 'table'}
            title="عرض كجدول"
            onClick={() => setViewMode('table')}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            className={`p-2 rounded-md ${viewMode === 'cards' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            aria-pressed={viewMode === 'cards'}
            title="عرض كبطاقات"
            onClick={() => setViewMode('cards')}
          >
            <Grid className="w-5 h-5" />
          </button>
        </div>

        {/* Filters - compact row */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-800">فلاتر البحث</h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="بحث في الجولات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-10 text-sm border border-gray-200 rounded-md w-full"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm w-full h-10"
              >
                <option value="all">جميع الحالات</option>
                <option value="scheduled">مجدولة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
                <option value="overdue">متأخرة</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm w-full h-10"
              >
                <option value="all">جميع الأولويات</option>
                <option value="urgent">عاجلة</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button onClick={() => refetch()} variant="outline" className="text-sm px-3 py-2">
                تطبيق
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Rounds List - two cards per row */}
        <div>
          {/* Table view */}
          <div className={viewMode === 'table' ? '' : 'hidden'}>
            <RoundsTable
              rounds={filteredRounds}
              onView={(id) => navigate(`/rounds/evaluate/${id}`, { state: { from: '/rounds/my-rounds' } })}
            // No edit/delete for My Rounds usually, but if needed can be added
            />
          </div>

          {/* Cards view */}
          <div className={viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 gap-6' : 'hidden'}>
            {filteredRounds.map((round) => (
              <Card key={round.id} className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-md">
                        <Building2 className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{round.department || '—'}</h3>
                          <p className="text-sm text-gray-600 mt-1">{round.roundCode || '—'}</p>
                        </div>

                        {/* Unified header strip: status, priority, scheduled date */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(round.status)}`}>
                            {getStatusText(round.status)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(round.priority)}`}>
                            {getPriorityText(round.priority)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2"> {round.scheduledDate ? new Date(round.scheduledDate).toLocaleDateString() : 'غير محدد'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Context-aware action button (moved from footer to top right for consistency with Cards view if desired, but let's keep it clean) */}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <div className="text-xs text-gray-500">التاريخ المجدول</div>
                      <div className="font-medium text-gray-800">{round.scheduledDate ? new Date(round.scheduledDate).toLocaleDateString('en-US') : 'غير محدد'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">نوع الجولة</div>
                      <div className="font-medium text-gray-800">{getRoundTypeText(round.roundType)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">القسم</div>
                      <div className="font-medium text-gray-800">{round.department || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">التقدم</div>
                      <div className="flex items-center gap-2">
                        <Progress value={getProgressPercentage(round)} className="h-2 w-16" />
                        <span className="font-medium text-gray-800">{getProgressPercentage(round)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Context-aware Action Button */}
                  <div className="pt-4 mt-4 border-t border-gray-100">
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
                        className="w-full border-green-200 text-green-700 hover:bg-green-50 font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm cursor-default"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        مكتملة
                      </Button>
                    )}
                    {/* Add Overdue logic if needed, e.g. Start anyway */}
                    {round.status === 'overdue' && (
                      <Button
                        onClick={() => handleStartRound(round.id)}
                        variant="destructive"
                        className="w-full font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                      >
                        <Play className="w-4 h-4" />
                        بدء الجولة (متأخرة)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
