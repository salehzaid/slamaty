import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useRounds, useDeleteRound } from '@/hooks/useRounds'
import CompleteRoundForm from '@/components/forms/CompleteRoundForm'
import StatsChart from '@/components/ui/StatsChart'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Play,
  Target,
  ExternalLink,
  List,
  Grid,
  BarChart3,
  Eye,
  Edit,
  Clock
} from 'lucide-react'
import RoundsTable from '@/components/ui/RoundsTable'

const RoundsListView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('cards' as 'cards' | 'table')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedRound, setSelectedRound] = useState<any>(null)

  const { data: rounds, loading, error, refetch } = useRounds()
  const auth = useAuth()
  const hasPermission = auth?.hasPermission || (() => false)
  const navigate = useNavigate()
  const deleteRoundMutation = useDeleteRound()
  const [searchParams, setSearchParams] = useSearchParams()

  // Handle opening create form from URL
  React.useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateForm(true)
      // Cleanup the search param
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('create')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-6"></div>
        <h3 className="text-2xl font-bold text-slate-900">جاري تحميل الجولات...</h3>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-red-100">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">تعذر تحميل الجولات</h3>
        <p className="text-slate-500 mb-8">{error}</p>
        <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 px-8">إعادة المحاولة</Button>
      </div>
    )
  }

  const handleCreateRound = () => setShowCreateForm(true)

  const handleFormSubmit = async (data: any) => {
    try {
      console.log('Creating round with data:', data)
      await apiClient.createRound(data)
      setShowCreateForm(false)
      refetch()
    } catch (error) {
      console.error('Error creating round:', error)
      alert('حدث خطأ في إنشاء الجولة')
    }
  }

  const handleFormCancel = () => {
    setShowCreateForm(false)
    setShowEditForm(false)
    setSelectedRound(null)
  }

  const handleEditRound = (round: any) => {
    setSelectedRound(round)
    setShowEditForm(true)
  }

  const handleDeleteRound = async (id: number, code: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الجولة ${code}؟`)) {
      try {
        await deleteRoundMutation.mutateAsync(id)
        refetch()
      } catch (error) {
        console.error('Error deleting round:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-50 text-blue-600 border-blue-100',
      'in_progress': 'bg-amber-50 text-amber-600 border-amber-100',
      'completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'cancelled': 'bg-red-50 text-red-600 border-red-100',
      'overdue': 'bg-rose-50 text-rose-600 border-rose-100',
    }
    return colors[(status || '').toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'completed': 'مكتملة',
      'in_progress': 'قيد التنفيذ',
      'scheduled': 'مجدولة',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة',
    }
    return texts[(status || '').toLowerCase()] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-slate-50 text-slate-600 border-slate-100',
      'medium': 'bg-blue-50 text-blue-600 border-blue-100',
      'high': 'bg-orange-50 text-orange-600 border-orange-100',
      'urgent': 'bg-red-50 text-red-600 border-red-100',
    }
    return colors[(priority || '').toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  const getPriorityText = (priority: string) => {
    const texts: Record<string, string> = {
      'urgent': 'عاجلة جداً',
      'high': 'عالية',
      'medium': 'متوسطة',
      'low': 'منخفضة',
    }
    return texts[(priority || '').toLowerCase()] || priority
  }

  const filteredRounds = (rounds || []).filter((round: any) => {
    const matchesSearch =
      (round.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (round.roundCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || (round.status || '').toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  if (showCreateForm || (showEditForm && selectedRound)) {
    return (
      <CompleteRoundForm
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        initialData={selectedRound}
      />
    )
  }

  return (
    <div className="space-y-10 pb-12">
      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl shadow-blue-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="p-6 bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider mb-3">
                <Target className="w-3 h-3" />
                نظرة شاملة
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">عرض <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">الجولات</span></h1>
              <p className="text-lg text-slate-500 font-medium">تم العثور على {filteredRounds.length} جولة تقييم بنظام الجودة.</p>
            </div>
          </div>
          <Button onClick={handleCreateRound} className="group relative bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-16 px-10 text-lg font-bold shadow-xl transition-all active:scale-95 border-none overflow-hidden">
            <Plus className="w-6 h-6 ml-3" />
            <span>إنشاء جولة جديدة</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsChart title="إجمالي الجولات" value={filteredRounds.length} icon={<Target className="w-6 h-6" />} color="text-blue-600" bgColor="bg-blue-50" />
        <StatsChart title="المكتملة" value={filteredRounds.filter((r: any) => (r.status || '').toLowerCase() === 'completed').length} icon={<CheckCircle2 className="w-6 h-6" />} color="text-emerald-600" bgColor="bg-emerald-50" maxValue={filteredRounds.length || 1} />
        <StatsChart title="قيد التنفيذ" value={filteredRounds.filter((r: any) => (r.status || '').toLowerCase() === 'in_progress').length} icon={<Play className="w-6 h-6" />} color="text-amber-600" bgColor="bg-amber-50" maxValue={filteredRounds.length || 1} />
        <StatsChart
          title="كفاءة الإنجاز"
          value={filteredRounds.length > 0 ? Math.round((filteredRounds.filter((r: any) => (r.status || '').toLowerCase() === 'completed').length / filteredRounds.length) * 100) : 0}
          icon={<BarChart3 className="w-6 h-6" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
          isPercentage={true}
        />
      </div>

      <Card className="bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-2">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="relative flex-1 group">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="البحث في جميع الجولات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 h-14 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl bg-white shadow-sm transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-14 px-6 rounded-2xl border-slate-200 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 transition-all bg-white shadow-sm outline-none"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="scheduled">مجدولة</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="overdue">متأخرة</option>
                </select>
                <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem]">
                  <button onClick={() => setViewMode('cards')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'cards' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}><Grid className="w-5 h-5" /></button>
                  <button onClick={() => setViewMode('table')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}><List className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            <Button variant="outline" className="h-14 px-6 rounded-2xl font-bold border-slate-200" onClick={() => refetch()}>تحديث</Button>
          </div>
        </CardContent>
      </Card>

      <div className="transition-all duration-500">
        {viewMode === 'table' ? (
          <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl">
            <RoundsTable
              rounds={filteredRounds}
              onView={(id) => navigate(`/evaluate/${id}`, { state: { from: '/rounds/list' } })}
              onEdit={(r) => handleEditRound(r)}
              onDelete={(id, code) => handleDeleteRound(id, code || String(id))}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRounds.length > 0 ? (
              filteredRounds.map((round: any) => {
                // Calculate days remaining/overdue
                const getDaysRemaining = (date: string | undefined) => {
                  if (!date) return null
                  const diff = new Date(date).getTime() - new Date().getTime()
                  return Math.ceil(diff / (1000 * 3600 * 24))
                }

                const daysRemaining = getDaysRemaining(round.endDate)
                const isOverdue = round.status === 'overdue' || (daysRemaining !== null && daysRemaining < 0)

                // Get total items
                const totalItems = Array.isArray(round.evaluation_items)
                  ? round.evaluation_items.length
                  : 0

                // Calculate progress
                const complianceScore = round.compliancePercentage || 0
                const progress = round.status === 'completed' ? 100
                  : round.status === 'scheduled' ? 0
                    : complianceScore > 0 ? complianceScore
                      : round.status === 'in_progress' ? 50
                        : 0

                // Determine progress ring color
                const ringColor = round.status === 'completed' ? 'stroke-emerald-500'
                  : isOverdue ? 'stroke-rose-500'
                    : round.status === 'in_progress' ? 'stroke-blue-500'
                      : 'stroke-slate-300'

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
                          round.status === 'in_progress' ? 'border-r-blue-500' :
                            'border-r-slate-300'
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
                              <svg width="64" height="64" className="transform -rotate-90">
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="26"
                                  fill="none"
                                  strokeWidth="5"
                                  className="stroke-slate-100"
                                />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="26"
                                  fill="none"
                                  strokeWidth="5"
                                  strokeDasharray={163.4}
                                  strokeDashoffset={163.4 - (progress / 100) * 163.4}
                                  strokeLinecap="round"
                                  className={cn("transition-all duration-1000 ease-out", ringColor)}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-black text-slate-900">{progress}%</span>
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
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg text-sm">
                                <span className="text-blue-500">📋</span>
                                <span className="font-bold text-blue-700">{totalItems}</span>
                                <span className="text-blue-600 text-xs">بند</span>
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
                              {round.scheduledDate ? new Date(round.scheduledDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }) : '—'}
                              {round.endDate && (
                                <>
                                  <span className="mx-1 text-slate-400">←</span>
                                  {new Date(round.endDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                                </>
                              )}
                            </span>
                          </div>

                          {/* Time Indicator */}
                          {round.status !== 'completed' && daysRemaining !== null && (
                            <>
                              {daysRemaining < 0 ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  متأخر {Math.abs(daysRemaining)} يوم
                                </div>
                              ) : daysRemaining >= 0 ? (
                                <div className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
                                  daysRemaining <= 2 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                )}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {daysRemaining === 0 ? 'آخر يوم' : `متبقي ${daysRemaining} يوم`}
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>

                        {/* Assigned Users - Avatar Style */}
                        {round.assignedTo && round.assignedTo.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 overflow-hidden">
                            <div className="flex -space-x-2 space-x-reverse flex-shrink-0">
                              {(round.assignedTo as string[]).slice(0, 3).map((user: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-[9px] font-bold text-white border-2 border-white"
                                  title={user}
                                >
                                  {user?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              ))}
                              {(round.assignedTo as string[]).length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 border-2 border-white">
                                  +{(round.assignedTo as string[]).length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 pt-0 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => navigate(`/evaluate/${round.id}`, { state: { from: '/rounds/list' } })}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-600"
                          onClick={() => handleEditRound(round)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => navigate(`/evaluate/${round.id}`, { state: { from: '/rounds/list' } })}
                          className="flex-1 h-10 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white border-none"
                        >
                          <ExternalLink className="w-4 h-4 ml-2" />
                          استعراض الجولة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-100 border-dashed text-center">
                <div className="p-8 bg-blue-50 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <Target className="w-16 h-16 text-blue-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">لا توجد جولات حالياً</h3>
                <p className="text-lg text-slate-500 font-medium max-w-md mx-auto mb-6">ابدأ بإنشاء أول جولة تقييم لإدارة عمليات الجودة.</p>
                <Button onClick={handleCreateRound} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-lg font-bold rounded-xl">
                  <Plus className="w-5 h-5 ml-2" />
                  إنشاء جولة جديدة
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoundsListView
