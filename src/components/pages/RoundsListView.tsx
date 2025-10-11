import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRounds, useDeleteRound } from '@/hooks/useRounds'
import CompleteRoundForm from '@/components/forms/CompleteRoundForm'
import StatsChart from '@/components/ui/StatsChart'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  User, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  Filter,
  Eye,
  Edit,
  Play,
  MoreHorizontal,
  Trash2
} from 'lucide-react'

const RoundsListView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedRound, setSelectedRound] = useState<any>(null)
  
  const { data: rounds, loading, error, refetch } = useRounds()
  const { hasPermission } = useAuth()
  const navigate = useNavigate()
  const deleteRoundMutation = useDeleteRound()

  // Debug logging
  console.log('RoundsListView - rounds data:', rounds)
  console.log('RoundsListView - loading:', loading)
  console.log('RoundsListView - error:', error)

  // Handle create round
  const handleCreateRound = () => {
    setShowCreateForm(true)
  }

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    try {
      console.log('Creating round:', data)
      
      // Prepare data for backend
      const roundData = {
        title: data.title,
        description: data.description,
        round_type: data.round_type,
        department: data.department || 'عام', // Use department from form or default
        assigned_to: data.assigned_to || data.assigned_users, // Array of user IDs
        scheduled_date: data.scheduled_date,
        priority: data.priority,
        notes: data.notes,
        evaluation_items: data.evaluation_items || data.selected_items, // Array of evaluation item IDs
        round_code: data.round_code
      }
      
      // Call API to create round
      await apiClient.createRound(roundData)
      
      console.log('Round created successfully')
      setShowCreateForm(false)
      refetch()
    } catch (error) {
      console.error('Error creating round:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('حدث خطأ في إنشاء الجولة: ' + errorMessage)
    }
  }

  // Handle form cancel
  const handleFormCancel = () => {
    setShowCreateForm(false)
    setShowEditForm(false)
    setSelectedRound(null)
  }

  // Handle edit round
  const handleEditRound = (round: any) => {
    setSelectedRound(round)
    setShowEditForm(true)
  }

  // Handle edit form submission
  const handleEditSubmit = async (data: any) => {
    try {
      console.log('Updating round:', selectedRound.id, data)
      
      // Prepare data for backend
      const updateData = {
        title: data.title,
        description: data.description,
        round_type: data.round_type,
        department: data.department || 'عام',
        assigned_to: data.assigned_to || data.assigned_users,
        // Convert date to datetime, but avoid appending time twice if already present
        scheduled_date: data.scheduled_date
          ? (String(data.scheduled_date).includes('T') ? data.scheduled_date : `${data.scheduled_date}T10:00:00`)
          : null,
        priority: data.priority,
        notes: data.notes,
        evaluation_items: data.evaluation_items || data.selected_items,
        selected_categories: data.selected_categories,  // إرسال التصنيفات المحددة
        round_code: data.round_code
      }
      
      console.log('Update payload:', updateData)
      
      // Call API to update round
      await apiClient.updateRound(selectedRound.id, updateData)
      
      console.log('Round updated successfully')
      setShowEditForm(false)
      setSelectedRound(null)
      refetch()
    } catch (error) {
      console.error('Error updating round:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('حدث خطأ في تحديث الجولة: ' + errorMessage)
    }
  }

  // Handle delete round
  const handleDeleteRound = async (roundId: number, roundTitle: string) => {
    // Check permissions - allow super_admin and quality_manager
    if (!hasPermission(['super_admin', 'quality_manager'])) {
      alert('ليس لديك صلاحية لحذف الجولات. هذه الصلاحية مخصصة لمدير النظام ومدير الجودة فقط.')
      return
    }

    const confirmed = window.confirm(`هل أنت متأكد من حذف الجولة "${roundTitle}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)
    if (!confirmed) return

    console.log('🗑️ Attempting to delete round:', roundId)
    
    try {
      const result = await deleteRoundMutation.mutate(roundId)
      console.log('✅ Round deleted successfully:', result)
      alert('تم حذف الجولة بنجاح')
      refetch()
    } catch (error) {
      console.error('❌ Error deleting round:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('حدث خطأ في حذف الجولة: ' + errorMessage)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Get status text
  const getStatusText = (status: string) => {
    const texts = {
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتملة',
      'cancelled': 'ملغاة',
    }
    return texts[status as keyof typeof texts] || status
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Get priority text
  const getPriorityText = (priority: string) => {
    const texts = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة',
    }
    return texts[priority as keyof typeof texts] || priority
  }

  // Filter rounds based on search and status
  const filteredRounds = Array.isArray(rounds) ? rounds.filter((round: any) => {
    const matchesSearch = round.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         round.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || round.status === filterStatus
    return matchesSearch && matchesStatus
  }) : []

  // Show create form
  if (showCreateForm) {
    return <CompleteRoundForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
  }

  // Show edit form
  if (showEditForm && selectedRound) {
    return <CompleteRoundForm onSubmit={handleEditSubmit} onCancel={handleFormCancel} initialData={selectedRound} isEdit={true} />
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">جاري تحميل الجولات</h3>
          <p className="text-lg text-gray-600">يرجى الانتظار...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">خطأ في تحميل الجولات</h3>
          <p className="text-lg text-gray-600 mb-8">{error}</p>
          <Button 
            onClick={refetch} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-gray-100 rounded-lg">
                <BarChart3 className="w-7 h-7 text-gray-700" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">عرض الجولات</h1>
                <p className="text-lg text-gray-600">عرض وإدارة جميع الجولات في شكل قائمة</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleCreateRound}
                className="bg-blue-600 text-white flex items-center gap-2 px-4 py-2 h-10 text-sm font-semibold rounded-md shadow-sm hover:shadow-md transition"
              >
                <Plus className="w-5 h-5" />
                إنشاء جولة جديدة
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">إجمالي الجولات</p>
                  <p className="text-3xl font-bold">{filteredRounds.length}</p>
                </div>
                <Target className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">مكتملة</p>
                  <p className="text-3xl font-bold">
                    {filteredRounds.filter((r: any) => r.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">قيد التنفيذ</p>
                  <p className="text-3xl font-bold">
                    {filteredRounds.filter((r: any) => r.status === 'in_progress').length}
                  </p>
                </div>
                <Play className="w-12 h-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">متأخرة</p>
                  <p className="text-3xl font-bold">
                    {filteredRounds.filter((r: any) => r.status === 'overdue').length}
                  </p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsChart
            title="معدل الإنجاز"
            value={filteredRounds.length > 0 ? Math.round((filteredRounds.filter((r: any) => r.status === 'completed').length / filteredRounds.length) * 100) : 0}
            previousValue={85}
            icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
            color="text-green-600"
            bgColor="bg-green-100"
            trend="up"
            trendValue={5}
          />
          
          <StatsChart
            title="الجولات النشطة"
            value={filteredRounds.filter((r: any) => r.status === 'in_progress').length}
            previousValue={3}
            icon={<Play className="w-6 h-6 text-blue-600" />}
            color="text-blue-600"
            bgColor="bg-blue-100"
            trend="up"
            trendValue={2}
          />
          
          <StatsChart
            title="متوسط الأولوية"
            value={filteredRounds.length > 0 ? Math.round(filteredRounds.reduce((acc: number, round: any) => {
              const priorityValues = { low: 1, medium: 2, high: 3, urgent: 4 };
              return acc + (priorityValues[round.priority as keyof typeof priorityValues] || 2);
            }, 0) / filteredRounds.length) : 0}
            previousValue={2}
            icon={<Target className="w-6 h-6 text-orange-600" />}
            color="text-orange-600"
            bgColor="bg-orange-100"
            trend="stable"
            trendValue={0}
          />
          
          <StatsChart
            title="كفاءة الفريق"
            value={92}
            previousValue={88}
            icon={<User className="w-6 h-6 text-purple-600" />}
            color="text-purple-600"
            bgColor="bg-purple-100"
            trend="up"
            trendValue={4}
          />
        </div>

        {/* Filters - simple and formal */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-800">فلاتر البحث</h3>
            </div>
            <div>
              <Button variant="outline" className="text-sm px-3 py-1">تطبيق</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-10 text-sm border border-gray-200 rounded-md"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <option value="all">جميع الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
            <div className="flex gap-2">
              <Button variant="outline" className="text-sm px-3 py-2">تصدير</Button>
              <Button variant="outline" className="text-sm px-3 py-2"><MoreHorizontal className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        {/* Enhanced Rounds List - two cards per row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredRounds.length > 0 ? (
            filteredRounds.map((round: any) => (
              <Card key={round.id} className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-md">
                        <Target className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{round.title || 'جولة بدون عنوان'}</h3>
                        <p className="text-sm text-gray-600 mt-1">{round.description ? (round.description.length > 120 ? round.description.slice(0, 117) + '...' : round.description) : '—'}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={`${getStatusColor(round.status)} text-xs px-2 py-1 rounded-full`}>{getStatusText(round.status)}</Badge>
                          <Badge className={`${getPriorityColor(round.priority)} text-xs px-2 py-1 rounded-full`}>{getPriorityText(round.priority)}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" className="text-sm px-3 py-1" onClick={() => navigate(`/rounds/evaluate/${round.id}`, { state: { from: '/rounds/list' } })}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasPermission(['super_admin', 'quality_manager', 'department_head']) && (
                        <Button variant="ghost" className="text-sm px-3 py-1" onClick={() => handleEditRound(round)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission(['super_admin']) && (
                        <Button variant="ghost" className="text-sm px-3 py-1 text-red-600" onClick={() => handleDeleteRound(round.id, round.title)} disabled={deleteRoundMutation.loading}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <div className="text-xs text-gray-500">التاريخ المجدول</div>
                      <div className="font-medium text-gray-800">{round.scheduledDate ? new Date(round.scheduledDate).toLocaleDateString('en-US') : 'غير محدد'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">المسؤول</div>
                      <div className="font-medium text-gray-800">{round.assignedTo && round.assignedTo.length > 0 ? round.assignedTo.join(', ') : 'غير محدد'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">القسم</div>
                      <div className="font-medium text-gray-800">{round.department || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">كود الجولة</div>
                      <div className="font-medium text-gray-800 font-mono">{round.roundCode || 'غير محدد'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
                <CardContent className="p-20 text-center relative">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full -translate-y-20 translate-x-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-100/20 to-transparent rounded-full translate-y-16 -translate-x-16"></div>
                
                <div className="relative">
                  <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-40 h-40 mx-auto mb-10 flex items-center justify-center shadow-lg">
                    <Target className="w-20 h-20 text-blue-500" />
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    {searchTerm || filterStatus !== 'all' ? 'لا توجد نتائج' : 'لا توجد جولات'}
                  </h3>
                  <p className="text-xl text-gray-600 mb-12 max-w-lg mx-auto leading-relaxed font-medium">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'جرب تغيير معايير البحث أو الفلترة للعثور على الجولات المطلوبة'
                      : 'ابدأ بإنشاء أول جولة تقييم لإدارة عمليات الجودة'
                    }
                  </p>
                  <Button 
                    onClick={handleCreateRound}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-5 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-7 h-7 ml-3" />
                    إنشاء جولة جديدة
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoundsListView
