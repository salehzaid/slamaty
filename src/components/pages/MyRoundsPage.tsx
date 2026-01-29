import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Users,
  Building2,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useMyRounds } from '@/hooks/useRounds'
import { apiClient } from '@/lib/api'
import CapaForm from '@/components/forms/CapaForm'
import { CapaCreateForm } from '@/lib/validations'
import { useNavigate, useLocation } from 'react-router-dom'
import { isCapaEnabled } from '@/lib/features'
import { cn } from '@/lib/utils'
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
  const auth = useAuth()
  const user = auth?.user
  const { data: myRounds, loading, error, refetch } = useMyRounds()
  const [stats, setStats] = useState<RoundStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const [showCapaForm, setShowCapaForm] = useState(false)
  const [capaInitialData, setCapaInitialData] = useState<Partial<CapaCreateForm> | null>(null)
  const [createdCapaInfo, setCreatedCapaInfo] = useState<{ id: number | null, roundId?: number | null } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const response = await apiClient.getMyRoundsStats()
        setStats(response)
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [myRounds])

  // Handle success messages
  useEffect(() => {
    if (location.state) {
      const state = location.state as any
      if (state.message) {
        setSuccessMessage(state.message)
        setTimeout(() => {
          setSuccessMessage(null)
          navigate(location.pathname, { replace: true, state: {} })
        }, 5000)
      }
    }
  }, [location.state, navigate, location.pathname])

  const handleStartRound = (roundId: number) => {
    navigate(`/evaluate/${roundId}`)
  }

  const handleCapaSubmit = async (data: any) => {
    try {
      if (!data) return
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
      setCapaInitialData(null)
      alert('تم إنشاء الخطة التصحيحية وحفظها في النظام')
    } catch (err) {
      console.error('Error creating CAPA:', err)
      alert('حدث خطأ أثناء إنشاء الخطة التصحيحية')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'bg-blue-50 text-blue-600 border-blue-100',
      'in_progress': 'bg-amber-50 text-amber-600 border-amber-100',
      'completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'cancelled': 'bg-red-50 text-red-600 border-red-100',
      'overdue': 'bg-rose-50 text-rose-600 border-rose-100',
    }
    return colors[status as keyof typeof colors] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  const getStatusText = (status: string) => {
    const texts = {
      'completed': 'مكتملة',
      'in_progress': 'قيد التنفيذ',
      'scheduled': 'مجدولة',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة',
    }
    return texts[status as keyof typeof texts] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-slate-50 text-slate-600 border-slate-100',
      'medium': 'bg-blue-50 text-blue-600 border-blue-100',
      'high': 'bg-orange-50 text-orange-600 border-orange-100',
      'urgent': 'bg-red-50 text-red-600 border-red-100',
    }
    return colors[priority as keyof typeof colors] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  const getPriorityText = (priority: string) => {
    const texts = {
      'urgent': 'عاجلة جداً',
      'high': 'عالية',
      'medium': 'متوسطة',
      'low': 'منخفضة',
    }
    return texts[priority as keyof typeof texts] || priority
  }

  const getProgressPercentage = (round: any) => {
    return round.compliancePercentage || round.completionPercentage || 0
  }

  const getDaysRemaining = (date: string | undefined) => {
    if (!date) return null
    const diff = new Date(date).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }

  const getDaysOverdue = (date: string | undefined) => {
    if (!date) return null
    const diff = new Date().getTime() - new Date(date).getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }

  const filteredRounds = (myRounds || []).filter(round => {
    const matchesSearch =
      (round.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (round.roundCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || round.status === filterStatus
    const matchesPriority = filterPriority === 'all' || round.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-10 pb-12">
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg shadow-emerald-500/5">
          <div className="p-2 bg-emerald-500 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <p className="text-emerald-800 font-bold">{successMessage}</p>
        </div>
      )}

      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-black uppercase tracking-wider mb-3">
                <Building2 className="w-3 h-3" />
                المكلف بها حالياً
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">جولاتي <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">الشخصية</span></h1>
              <p className="text-lg text-slate-500 font-medium">أهلاً بك، {user?.first_name || 'زميلنا'}. لديك {myRounds?.filter(r => r.status !== 'completed').length || 0} جولات نشطة.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsChart title="إجمالي الجولات" value={stats?.total || 0} icon={<Users className="w-6 h-6" />} color="text-purple-600" bgColor="bg-purple-50" />
        <StatsChart title="المكتملة" value={stats?.completed || 0} icon={<CheckCircle2 className="w-6 h-6" />} color="text-emerald-600" bgColor="bg-emerald-50" trend="up" />
        <StatsChart title="قيد التنفيذ" value={stats?.in_progress || 0} icon={<Clock className="w-6 h-6" />} color="text-blue-600" bgColor="bg-blue-50" />
        <StatsChart title="المتأخرة" value={stats?.overdue || 0} icon={<AlertTriangle className="w-6 h-6" />} color="text-rose-600" bgColor="bg-rose-50" trend="down" />
      </div>

      <Card className="bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-2">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 group w-full">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-purple-600 transition-colors" />
              <Input
                placeholder="البحث في جولاتي برمز الجولة أو القسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12 h-14 text-lg border-slate-200 focus:border-purple-500 focus:ring-purple-500 rounded-2xl bg-white shadow-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-14 px-6 rounded-2xl border-slate-200 text-slate-700 font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white shadow-sm outline-none"
              >
                <option value="all">الحالة: الكل</option>
                <option value="scheduled">مجدولة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
                <option value="overdue">متأخرة</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="h-14 px-6 rounded-2xl border-slate-200 text-slate-700 font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white shadow-sm outline-none"
              >
                <option value="all">الأولوية: الكل</option>
                <option value="urgent">عاجلة جداً</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>

              <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50" onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterPriority('all') }}>
                <Filter className="w-5 h-5 text-slate-400" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRounds.length > 0 ? (
          filteredRounds.map((round) => {
            const daysRemaining = getDaysRemaining(round.endDate)
            const daysOverdue = getDaysOverdue(round.endDate)
            const isOverdue = round.status === 'overdue' || (daysRemaining !== null && daysRemaining < 0)

            // Get total items from evaluation_items array
            const totalItems = Array.isArray(round.evaluation_items)
              ? round.evaluation_items.length
              : (round as any).totalItems || 0

            // Calculate progress based on status and compliance
            const complianceScore = round.compliancePercentage || (round as any).completionPercentage || 0
            const progress = round.status === 'completed' ? 100
              : round.status === 'scheduled' ? 0
                : complianceScore > 0 ? complianceScore
                  : round.status === 'in_progress' ? 50
                    : 0

            // Determine progress ring color based on status
            const ringColor = round.status === 'completed' ? 'green'
              : isOverdue ? 'red'
                : round.status === 'in_progress' ? 'purple'
                  : 'blue'

            // Get round type label
            const getRoundTypeLabel = (type: string) => {
              const types: Record<string, { label: string, color: string, icon: string }> = {
                'internal': { label: 'داخلية', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🏢' },
                'external': { label: 'خارجية', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🌐' },
                'audit': { label: 'تدقيق', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '📋' },
                'inspection': { label: 'تفتيش', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '🔍' },
                'patient_safety': { label: 'سلامة المرضى', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: '🏥' },
              }
              return types[type?.toLowerCase()] || { label: type || 'عامة', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '📌' }
            }

            const roundType = getRoundTypeLabel(round.roundType)

            return (
              <Card
                key={round.id}
                className={cn(
                  "group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1",
                  "border-r-4",
                  round.status === 'completed' ? 'border-r-emerald-500' :
                    isOverdue ? 'border-r-rose-500' :
                      round.status === 'in_progress' ? 'border-r-purple-500' :
                        'border-r-blue-500'
                )}
              >
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-5 pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      {/* Round Type Badge */}
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border",
                        roundType.color
                      )}>
                        <span>{roundType.icon}</span>
                        {roundType.label}
                      </div>

                      {/* Status & Priority */}
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border",
                          getStatusColor(round.status)
                        )}>
                          {getStatusText(round.status)}
                        </span>
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border",
                          getPriorityColor(round.priority)
                        )}>
                          {getPriorityText(round.priority)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Progress Ring */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <svg width="72" height="72" className="transform -rotate-90">
                            <circle
                              cx="36"
                              cy="36"
                              r="30"
                              fill="none"
                              strokeWidth="6"
                              className="stroke-slate-100"
                            />
                            <circle
                              cx="36"
                              cy="36"
                              r="30"
                              fill="none"
                              strokeWidth="6"
                              strokeDasharray={188.5}
                              strokeDashoffset={188.5 - (progress / 100) * 188.5}
                              strokeLinecap="round"
                              className={cn(
                                "transition-all duration-1000 ease-out",
                                ringColor === 'green' ? 'stroke-emerald-500' :
                                  ringColor === 'red' ? 'stroke-rose-500' :
                                    ringColor === 'purple' ? 'stroke-purple-500' :
                                      'stroke-blue-500'
                              )}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-base font-black text-slate-900">{progress}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {round.roundCode || 'NO-CODE'}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight truncate mb-2">
                          {round.department || 'القسم العام'}
                        </h3>

                        {/* Items Count */}
                        {totalItems > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-lg text-sm">
                            <span className="text-purple-500">📋</span>
                            <span className="font-bold text-purple-700">{totalItems}</span>
                            <span className="text-purple-600 text-xs">بند تقييم</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date & Time Info */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {/* Date Range */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-600">
                          {new Date(round.scheduledDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                          {round.endDate && (
                            <>
                              <span className="mx-1 text-slate-400">←</span>
                              {new Date(round.endDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                            </>
                          )}
                        </span>
                      </div>

                      {/* Time Indicator */}
                      {round.status !== 'completed' && (
                        <>
                          {isOverdue && daysOverdue !== null && daysOverdue > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              متأخر {daysOverdue} يوم
                            </div>
                          ) : daysRemaining !== null && daysRemaining >= 0 ? (
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
                              daysRemaining <= 2 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            )}>
                              <Clock className="w-3.5 h-3.5" />
                              {daysRemaining === 0 ? 'اليوم آخر يوم' : `متبقي ${daysRemaining} يوم`}
                            </div>
                          ) : null}
                        </>
                      )}

                      {/* Compliance Badge */}
                      {round.compliancePercentage > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          امتثال {round.compliancePercentage}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="p-4 pt-0">
                    <Button
                      onClick={() => {
                        if (round.status === 'scheduled') handleStartRound(round.id)
                        else navigate(`/evaluate/${round.id}`)
                      }}
                      className={cn(
                        "w-full h-12 rounded-xl text-sm font-black transition-all duration-300 border-none",
                        round.status === 'completed'
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : round.status === 'scheduled'
                            ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200"
                      )}
                      disabled={round.status === 'completed'}
                    >
                      {round.status === 'scheduled' ? (
                        <>
                          <Play className="w-4 h-4 ml-2" />
                          بدء الجولة
                        </>
                      ) : round.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                          مكتملة
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4 ml-2" />
                          مواصلة التقييم
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 border-dashed text-center">
            <div className="p-8 bg-slate-50 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Users className="w-16 h-16 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">لا توجد جولات حالياً</h3>
            <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">لم يتم العثور على أي جولات تطابق معايير البحث الحالية.</p>
          </div>
        )}
      </div>

      {isCapaEnabled() && createdCapaInfo && (
        <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white shadow-2xl rounded-[1.5rem] p-6 flex items-center gap-6 border border-white/10 backdrop-blur-xl">
            <div>
              <div className="font-black text-lg mb-1">تم إنشاء خطة تصحيحية (CAPA)</div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">ID: {createdCapaInfo.id}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5 font-bold" onClick={() => navigate(`/capa?roundId=${createdCapaInfo.roundId || ''}`)}>عرض</Button>
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setCreatedCapaInfo(null)}>إغلاق</Button>
            </div>
          </div>
        </div>
      )}

      {isCapaEnabled() && showCapaForm && capaInitialData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-[2.5rem] shadow-2xl">
            <CapaForm
              initialData={capaInitialData}
              onCancel={() => { setShowCapaForm(false); setCapaInitialData(null) }}
              onSubmit={handleCapaSubmit}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MyRoundsPage
