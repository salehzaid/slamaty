import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, MoreHorizontal, AlertTriangle, X, Trash2, RefreshCw, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useCapas, useAllCapasUnfiltered, useDeleteCapa, useDeleteAllCapas, useUpdateCapa } from '@/hooks/useCapas'
import { useAuth } from '@/context/AuthContext'

const CapaManagement: React.FC = () => {
  console.log('🔄 CapaManagement component is rendering...')
  
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const [filteredRoundId, setFilteredRoundId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showAllCapas, setShowAllCapas] = useState(false)
  
  const { data: capas, loading: filteredLoading, error: filteredError, refetch: refetchFiltered } = useCapas()
  const { data: allCapas, loading: allLoading, error: allError, refetch: refetchAll } = useAllCapasUnfiltered()
  const { hasPermission } = useAuth()
  const deleteCapaMutation = useDeleteCapa()
  const deleteAllCapasMutation = useDeleteAllCapas()
  const updateCapaMutation = useUpdateCapa()

  // Use appropriate data source based on toggle
  const currentCapas = showAllCapas ? allCapas : capas
  const loading = showAllCapas ? allLoading : filteredLoading
  const error = showAllCapas ? allError : filteredError
  const refetch = showAllCapas ? refetchAll : refetchFiltered

  // Debug: Add console log to check if component is rendering
  console.log('CapaManagement data:', { capas, loading, error, hasAuth: !!hasPermission })
  
  // Check for roundId in URL params and set filter
  useEffect(() => {
    const roundIdParam = searchParams.get('roundId')
    if (roundIdParam) {
      const roundId = parseInt(roundIdParam)
      if (!isNaN(roundId)) {
        setFilteredRoundId(roundId)
      }
    } else {
      setFilteredRoundId(null)
    }
  }, [searchParams])
  
  // Ensure currentCapas is always an array and filter by roundId if specified
  const allCapasArray = Array.isArray(currentCapas) ? currentCapas : []
  const capasArray = filteredRoundId 
    ? allCapasArray.filter(capa => capa.roundId === filteredRoundId)
    : allCapasArray

  const clearRoundFilter = () => {
    setFilteredRoundId(null)
    setSearchParams({})
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to refresh CAPAs', err)
    }
  }

  const handleDeleteCapa = async (capaId: number) => {
    try {
      await deleteCapaMutation.mutate(capaId)
      refetch() // Refresh the data
    } catch (error: any) {
      console.error('Failed to delete CAPA:', error)
      
      // Handle different error types
      if (error?.response?.status === 401) {
        alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.')
        // Redirect to login or refresh token
        window.location.href = '/login'
      } else if (error?.response?.status === 403) {
        alert('ليس لديك صلاحية لحذف خطط التصحيح.')
      } else if (error?.response?.status === 404) {
        alert('خطة التصحيح غير موجودة.')
      } else {
        alert(`فشل في حذف خطة التصحيح: ${error?.message || 'خطأ غير معروف'}`)
      }
    }
  }

  const handleDeleteAllCapas = async () => {
    try {
      await deleteAllCapasMutation.mutate()
      refetch() // Refresh the data
    } catch (error: any) {
      console.error('Failed to delete all CAPAs:', error)
      
      // Handle different error types
      if (error?.response?.status === 401) {
        alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.')
        // Redirect to login or refresh token
        window.location.href = '/login'
      } else if (error?.response?.status === 403) {
        alert('ليس لديك صلاحية لحذف جميع خطط التصحيح.')
      } else {
        alert(`فشل في حذف جميع خطط التصحيح: ${error?.message || 'خطأ غير معروف'}`)
      }
    }
  }

  const handleStartCapa = async (capaId: number) => {
    try {
      await updateCapaMutation.mutate({
        id: capaId,
        data: { status: 'in_progress' }
      })
      refetch() // Refresh the data
    } catch (error: any) {
      console.error('Failed to start CAPA:', error)
      
      // Handle different error types
      if (error?.response?.status === 401) {
        alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.')
        // Redirect to login or refresh token
        window.location.href = '/login'
      } else if (error?.response?.status === 403) {
        alert('ليس لديك صلاحية لبدء خطة التصحيح.')
      } else {
        alert(`فشل في بدء خطة التصحيح: ${error?.message || 'خطأ غير معروف'}`)
      }
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'implemented': 'bg-green-100 text-green-800',
      'verification': 'bg-purple-100 text-purple-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'closed': 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      'pending': 'معلقة',
      'assigned': 'مكلفة',
      'in_progress': 'قيد التنفيذ',
      'implemented': 'منفذة',
      'verification': 'تحت المراجعة',
      'verified': 'متحققة',
      'rejected': 'مرفوضة',
      'closed': 'مغلقة',
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

  const getProgressPercentage = (status: string) => {
    const progress = {
      'pending': 0,
      'assigned': 20,
      'in_progress': 50,
      'implemented': 80,
      'verification': 90,
      'verified': 100,
      'rejected': 0,
      'closed': 100,
    }
    return progress[status as keyof typeof progress] || 0
  }

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل الخطط التصحيحية...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            إدارة الخطط التصحيحية
            {filteredRoundId && (
              <span className="text-sm font-normal text-gray-600">
                (لجولة #{filteredRoundId})
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            إدارة وتتبع الخطط التصحيحية (CAPA)
            {!showAllCapas && (
              <span className="text-sm text-blue-600 font-medium"> - العناصر غير المطبقة فقط</span>
            )}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">آخر تحديث: {lastUpdated.toLocaleString('ar-SA')}</p>
          )}
        </div>
          <div className="flex items-center gap-2">
          {/* Toggle for showing all CAPAs vs filtered CAPAs */}
          {hasPermission(['super_admin', 'quality_manager']) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm text-gray-700">
                {showAllCapas ? 'جميع الخطط' : 'العناصر غير المطبقة فقط'}
              </span>
              <button
                onClick={() => setShowAllCapas(!showAllCapas)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showAllCapas ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showAllCapas ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          {hasPermission(['super_admin']) && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteAllConfirm(true)} 
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف جميع CAPA
            </Button>
          )}
        </div>
      </div>

      {/* Round Filter Banner */}
      {filteredRoundId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  عرض خطط الجولة #{filteredRoundId} فقط
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearRoundFilter}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                <X className="w-4 h-4 mr-1" />
                إزالة الفلتر
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الخطط</p>
                <p className="text-2xl font-bold text-gray-900">{capasArray.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-blue-600">
                  {capasArray.filter(c => c.status === 'in_progress').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">منفذة</p>
                <p className="text-2xl font-bold text-green-600">
                  {capasArray.filter(c => c.status === 'implemented' || c.status === 'verified').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متأخرة</p>
                <p className="text-2xl font-bold text-red-600">
                  {capasArray.filter(c => new Date(c.targetDate) < new Date() && c.status !== 'implemented' && c.status !== 'verified').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الخطط التصحيحية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">معلقة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="implemented">منفذة</option>
                <option value="verified">متحققة</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                فلترة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CAPAs List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل الخطط التصحيحية...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">حدث خطأ في تحميل الخطط التصحيحية: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capasArray.map((capa) => (
            <Card key={capa.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{capa.title}</CardTitle>
                    <p className="text-sm text-gray-600 mb-2">{capa.department}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getStatusColor(capa.status)}>
                        {getStatusText(capa.status)}
                      </Badge>
                      <Badge className={getPriorityColor(capa.priority)}>
                        {getPriorityText(capa.priority)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">التقدم</span>
                        <span className="font-medium">{getProgressPercentage(capa.status)}%</span>
                      </div>
                      <Progress value={getProgressPercentage(capa.status)} className="h-2" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {hasPermission(['super_admin', 'quality_manager']) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowDeleteConfirm(capa.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {(capa.status === 'pending' || capa.status === 'assigned') && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStartCapa(capa.id)}
                        disabled={updateCapaMutation.loading}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="بدء الخطة التصحيحية"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/capa/edit/${capa.id}`)} className="text-gray-600 hover:bg-gray-50">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>المسؤول:</strong> {capa.assignedTo || 'غير محدد'}</p>
                  <p><strong>التاريخ المستهدف:</strong> {new Date(capa.targetDate).toLocaleDateString('en-US')}</p>
                  {capa.riskScore && (
                    <p><strong>درجة المخاطر:</strong> {capa.riskScore}/10</p>
                  )}
                  {capa.evaluationItemId && (
                    <p><strong>عنصر التقييم:</strong> #{capa.evaluationItemId}</p>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                  {capa.description}
                </p>
                <div className="mt-4">
                  <Button onClick={() => navigate(`/capa/edit/${capa.id}`)} className="w-full bg-green-600 text-white hover:bg-green-700">
                    عرض الخطة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {capasArray.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {filteredRoundId 
              ? `لا توجد خطط تصحيحية متاحة للجولة #${filteredRoundId}`
              : 'لا توجد خطط تصحيحية متاحة'
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            يتم إنشاء الخطط التصحيحية من نماذج التقييم عند وجود عناصر تحتاج تصحيح
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">تأكيد الحذف</h3>
                <p className="text-sm text-gray-600">هل أنت متأكد من حذف خطة التصحيح هذه؟</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ هذا الإجراء لا يمكن التراجع عنه. سيتم حذف خطة التصحيح نهائياً من النظام.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteCapaMutation.loading}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteCapa(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                disabled={deleteCapaMutation.loading}
                className="flex items-center gap-2"
              >
                {deleteCapaMutation.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    حذف نهائياً
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All CAPAs Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">تأكيد حذف جميع خطط التصحيح</h3>
                <p className="text-sm text-gray-600">هل أنت متأكد من حذف جميع خطط التصحيح؟</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-800">
                🚨 تحذير: هذا الإجراء سيحذف جميع خطط التصحيح نهائياً من النظام ولا يمكن التراجع عنه!
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={deleteAllCapasMutation.loading}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteAllCapas();
                  setShowDeleteAllConfirm(false);
                }}
                disabled={deleteAllCapasMutation.loading}
                className="flex items-center gap-2"
              >
                {deleteAllCapasMutation.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    حذف جميع CAPA
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CapaManagement
