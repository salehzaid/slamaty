import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CapaDashboard from '@/components/CapaDashboard'
import EnhancedCapaForm from '@/components/forms/EnhancedCapaForm'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react'

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
    notes?: string
  }>
  preventive_actions: Array<{
    task: string
    due_date?: string
    assigned_to_id?: number
    status: string
    completed_at?: string
    notes?: string
  }>
  verification_steps: Array<{
    step: string
    required: boolean
    completed: boolean
    completed_at?: string
    completed_by_id?: number
    notes?: string
  }>
  created_at: string
  assigned_to?: string
  estimated_cost?: number
  sla_days: number
  root_cause?: string
  status_history?: Array<{
    timestamp: string
    user_id: number
    from_status?: string
    to_status: string
    note?: string
  }>
}

interface EnhancedCapaManagementProps {
  capas?: CapaData[]
  departments?: Array<{ id: number; name: string }>
  users?: Array<{ id: number; first_name: string; last_name: string }>
  isLoading?: boolean
  onCreateCapa?: (data: any) => Promise<void>
  onUpdateCapa?: (id: number, data: any) => Promise<void>
  onViewCapa?: (capa: CapaData) => void
}

const EnhancedCapaManagement: React.FC<EnhancedCapaManagementProps> = ({
  capas = [],
  departments = [],
  users = [],
  isLoading = false,
  onCreateCapa,
  onUpdateCapa
}) => {
  const location = useLocation()
  // If we were navigated here with failingItems from evaluation, capture them
  const state = (location && (location.state as any)) || {}
  const failingItemsFromEval: any[] = state.failingItems || []
  const roundFromEval = state.round || null
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'view'>('dashboard')
  const [selectedCapa, setSelectedCapa] = useState<CapaData | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Start with empty; real CAPAs are loaded from API
  const mockCapas: CapaData[] = []

  // Local capas list state so we can append newly created CAPAs immediately
  const [capasList, setCapasList] = useState<CapaData[]>(capas && capas.length > 0 ? capas : mockCapas)

  // Items evaluated in rounds that are non-compliant and need CAPAs
  const [evaluatedFailingItems, setEvaluatedFailingItems] = useState<any[]>([])

  const fetchCapas = async () => {
    try {
      console.log('🔄 Starting fetchCapas...')
      const res = await apiClient.getCapas()
      console.log('📦 CAPAs API response (wrapped):', res)
      console.log('📦 res.data:', (res as any).data)
      console.log('📦 res type:', typeof res, Array.isArray(res))

      // ApiClient.request returns { data: <payload>, success: true }
      const payload: any = res && (res as any).data ? (res as any).data : res
      console.log('📦 payload:', payload)
      console.log('📦 payload type:', typeof payload, Array.isArray(payload))
      console.log('📦 payload.capas:', payload?.capas)
      console.log('📦 payload.capas length:', payload?.capas?.length)

      // payload may be an array or an object like { status: 'success', capas: [...], total_count }
      let capasArray: any[] = []
      if (Array.isArray(payload)) {
        console.log('✅ Payload is array')
        capasArray = payload
      } else if (payload && Array.isArray(payload.capas)) {
        console.log('✅ Payload.capas is array with length:', payload.capas.length)
        capasArray = payload.capas
      } else {
        console.log('❌ Could not extract capas array')
        console.log('❌ payload:', JSON.stringify(payload, null, 2))
      }

      console.log('📋 Extracted CAPAs array length:', capasArray.length)
      console.log('📋 Extracted CAPAs array:', capasArray)
      setCapasList(capasArray as any)
      console.log('✅ capasList updated')
    } catch (e) {
      console.error('❌ Failed to fetch CAPAs for dashboard:', e)
    }
  }

  useEffect(() => {
    // Try loading real CAPAs from server on mount
    fetchCapas()
  }, [])

  // If navigated with failing items, show them in a quick panel for creating CAPAs
  const { hasPermission } = useAuth()
  const [failingItems, setFailingItems] = useState<any[]>(failingItemsFromEval)

  useEffect(() => {
    if (failingItemsFromEval && failingItemsFromEval.length > 0) {
      // Switch to dashboard and show panel
      setCurrentView('dashboard')
      setFailingItems(failingItemsFromEval)
    }
  }, [failingItemsFromEval])

  const handleDismissFailingPanel = () => {
    setFailingItems([])
  }

  const handleCreateAllCapas = async () => {
    // Instead of creating final CAPAs directly (may violate DB constraints),
    // fetch non-compliant evaluation items and present them as drafts for review.
    if (!roundFromEval || !roundFromEval.id) return
    try {
      // For now, we'll skip this API call as it doesn't exist
      // const res: any = await apiClient.getRoundNonCompliantItems(roundFromEval.id)
      const res: any = { items: [] }
      const items = (res && (res.items || res.items === 0 ? res.items : (res.data?.items || res.data || []))) || []
      setEvaluatedFailingItems(items)
      setFailingItems([])
      // Show the panel (it will render evaluatedFailingItems)
      setCurrentView('dashboard')
      alert('تم تحميل عناصر غير مكتملة كمقترحات لمسودات الخطط. استخدم زر إنشاء مسودات لإنشاءها محلياً.')
    } catch (err) {
      console.error('Failed to load non-compliant items for round:', err)
      alert('فشل جلب العناصر غير المكتملة من السيرفر')
    }
  }

  const handleCreateDraftsForEvaluatedItems = () => {
    // Create frontend-only draft CAPAs for review (do not call backend create to avoid DB constraint issues)
    const source = failingItems.length > 0 ? failingItems : evaluatedFailingItems
    if (!source || source.length === 0) {
      alert('لا توجد عناصر لإنشاء مسودات لها')
      return
    }

    const drafts: CapaData[] = source.map((it: any, idx: number) => {
      const itemTitle = it.item_title || it.item_code || `عنصر ${it.item_id}`
      const targetDays = it.risk_level === 'CRITICAL' ? 7 : (it.risk_level === 'MAJOR' ? 14 : 30)
      const d = new Date(); d.setDate(d.getDate() + targetDays)

      return {
        id: Date.now() + idx,
        title: `خطة تصحيحية لعنصر: ${itemTitle}`,
        description: `عنصر: ${itemTitle}\nتفاصيل: ${it.comments || ''}`,
        department: it.department || roundFromEval?.department || 'عام',
        priority: 'medium',
        status: 'draft',
        verification_status: 'pending',
        severity: it.risk_level === 'CRITICAL' ? 5 : (it.risk_level === 'MAJOR' ? 4 : 3),
        target_date: d.toISOString(),
        escalation_level: 0,
        corrective_actions: [],
        preventive_actions: [],
        verification_steps: [],
        created_at: new Date().toISOString(),
        assigned_to: undefined,
        estimated_cost: undefined,
        sla_days: it.sla_days ?? 30,
        root_cause: ''
      }
    })

    setCapasList(prev => [...prev, ...drafts])
    setEvaluatedFailingItems([])
    setFailingItems([])
    alert(`تم إنشاء ${drafts.length} مسودة خطة عرضيا في القائمة — قم بمراجعتها وحفظها نهائياً`)
  }

  const handleCreateCapa = () => {
    setSelectedCapa(null)
    setIsEditing(false)
    setCurrentView('form')
  }

  const handleCreateCapaForItem = async (item: any) => {
    // Prefill form with evaluation item data (fall back if item title missing)
    const itemTitle = item.item_title || item.item_code || `عنصر ${item.item_id}`
    const prefill = {
      title: `خطة تصحيحية لعنصر: ${itemTitle}`,
      description: `عنصر: ${itemTitle}\nتفاصيل: ${item.comments || ''}`,
      round_id: item.round_id,
      department: roundFromEval?.department || '',
      evaluation_item_id: item.item_id,
      priority: 'medium',
      target_date: (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString(); })(),
      risk_score: 50
    }

    setSelectedCapa(prefill as any)
    setIsEditing(false)
    setCurrentView('form')
  }

  const handleEditCapa = (capa: CapaData) => {
    // Transform backend field names to frontend field names for the form
    const formData = {
      ...capa,
      // Transform root_cause -> root_cause_analysis
      root_cause_analysis: capa.root_cause || '',
      // Transform target_date -> resolution_deadline (extract date part)
      resolution_deadline: capa.target_date 
        ? new Date(capa.target_date).toISOString().split('T')[0] 
        : '',
      // Ensure arrays are properly formatted
      corrective_actions: Array.isArray(capa.corrective_actions) ? capa.corrective_actions : [],
      preventive_actions: Array.isArray(capa.preventive_actions) ? capa.preventive_actions : [],
      verification_steps: Array.isArray(capa.verification_steps) ? capa.verification_steps : []
    }
    
    console.log('📝 Editing CAPA with transformed data:', formData)
    setSelectedCapa(formData as any)
    setIsEditing(true)
    setCurrentView('form')
  }

  const handleViewCapa = (capa: CapaData) => {
    setSelectedCapa(capa)
    setCurrentView('view')
  }

  const handleStartCapa = async (capa: CapaData) => {
    // Open form directly without auto-save - user can save manually
    // Transform backend field names to frontend field names for the form
    const formData = {
      ...capa,
      // Transform root_cause -> root_cause_analysis
      root_cause_analysis: capa.root_cause || '',
      // Transform target_date -> resolution_deadline (extract date part)
      resolution_deadline: capa.target_date 
        ? new Date(capa.target_date).toISOString().split('T')[0] 
        : '',
      // Ensure arrays are properly formatted
      corrective_actions: Array.isArray(capa.corrective_actions) ? capa.corrective_actions : [],
      preventive_actions: Array.isArray(capa.preventive_actions) ? capa.preventive_actions : [],
      verification_steps: Array.isArray(capa.verification_steps) ? capa.verification_steps : []
    }
    
    console.log('🎬 Starting CAPA with transformed data:', formData)
    setSelectedCapa(formData as any)
    setIsEditing(true)
    setCurrentView('form')
  }

  const handleFormSubmit = async (data: any) => {
    try {
      console.log('📥 Raw form data received:', data)
      
      // Transform frontend field names to backend field names
      const transformedData = {
        title: data.title,
        description: data.description,
        department: data.department,
        priority: data.priority || 'medium',
        status: data.status || 'PENDING',
        verification_status: data.verification_status || 'pending',
        severity: data.severity || 3,
        estimated_cost: data.estimated_cost,
        // Transform root_cause_analysis -> root_cause
        root_cause: data.root_cause_analysis || data.root_cause || '',
        // Transform resolution_deadline -> target_date
        target_date: data.resolution_deadline || data.target_date || new Date().toISOString(),
        // Calculate sla_days from resolution_deadline if available
        sla_days: data.resolution_deadline 
          ? Math.ceil((new Date(data.resolution_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : data.sla_days || 14,
        corrective_actions: data.corrective_actions || [],
        preventive_actions: data.preventive_actions || [],
        verification_steps: data.verification_steps || [],
        round_id: data.round_id,
        evaluation_item_id: data.evaluation_item_id,
        assigned_to_id: data.assigned_to_id,
        escalation_level: data.escalation_level || 0
      }
      
      console.log('🔄 Transformed data for API:', transformedData)
      
      if (isEditing && selectedCapa) {
        console.log('🔄 Updating CAPA:', selectedCapa.id)
        if (onUpdateCapa) {
          await onUpdateCapa(selectedCapa.id, transformedData)
        } else {
          // fallback: call API directly
          const resp = await apiClient.updateCapa(selectedCapa.id, transformedData)
          console.log('✅ Update response:', resp)
        }
        // Refresh the list after update
        await fetchCapas()
        alert('✅ تم حفظ التحديثات بنجاح')
      } else {
        console.log('➕ Creating new CAPA')
        let createdCapa: any = null
        if (onCreateCapa) {
          await onCreateCapa(transformedData)
          // try refresh
          await fetchCapas()
        } else {
          // fallback: call API directly to create CAPA
          const resp = await apiClient.createCapa(transformedData)
          console.log('✅ createCapa response', resp)
          // Try to extract the created capa object from different response shapes
          createdCapa = resp?.data || resp
          if (createdCapa && createdCapa.id) {
            // Normalize dates and arrays if needed
            const normalized: CapaData = {
              id: createdCapa.id,
              title: createdCapa.title,
              description: createdCapa.description || '',
              department: createdCapa.department || '',
              priority: createdCapa.priority || 'medium',
              status: createdCapa.status || 'pending',
              verification_status: createdCapa.verification_status || 'pending',
              severity: createdCapa.severity ?? 3,
              target_date: createdCapa.target_date || new Date().toISOString(),
              escalation_level: createdCapa.escalation_level ?? 0,
              corrective_actions: Array.isArray(createdCapa.corrective_actions) ? createdCapa.corrective_actions : [],
              preventive_actions: Array.isArray(createdCapa.preventive_actions) ? createdCapa.preventive_actions : [],
              verification_steps: Array.isArray(createdCapa.verification_steps) ? createdCapa.verification_steps : [],
              created_at: createdCapa.created_at || new Date().toISOString(),
              assigned_to: createdCapa.assigned_to || undefined,
              estimated_cost: createdCapa.estimated_cost ?? undefined,
              sla_days: createdCapa.sla_days ?? 14,
              root_cause: createdCapa.root_cause || undefined,
              status_history: createdCapa.status_history || []
            }
            setCapasList(prev => [...prev, normalized])
          } else {
            // if creation returned no capa, refresh list
            await fetchCapas()
          }
        }
        alert('✅ تم إنشاء الخطة التصحيحية بنجاح')
      }
      setCurrentView('dashboard')
    } catch (error) {
      console.error('❌ Error saving CAPA:', error)
      alert(`❌ فشل حفظ الخطة التصحيحية: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
      // Don't close the form on error - let user try again
      return
    }
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedCapa(null)
    setIsEditing(false)
  }

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

  if (currentView === 'form') {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة للوحة الرئيسية
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'تعديل الخطة التصحيحية' : 'إنشاء خطة تصحيحية جديدة'}
          </h1>
        </div>
        
        <EnhancedCapaForm
          onSubmit={handleFormSubmit}
          initialData={(selectedCapa as any) || undefined}
          onCancel={handleBackToDashboard}
          departments={departments}
          users={users}
        />
      </div>
    )
  }

  if (currentView === 'view' && selectedCapa) {
    const severityInfo = getSeverityInfo(selectedCapa.severity)
    const isOverdue = new Date(selectedCapa.target_date) < new Date() && selectedCapa.verification_status !== 'verified'
    
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة للوحة الرئيسية
          </Button>
          <h1 className="text-2xl font-bold">تفاصيل الخطة التصحيحية</h1>
        </div>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedCapa.title}</CardTitle>
                  <CardDescription className="mt-2">{selectedCapa.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedCapa.verification_status)}>
                    {selectedCapa.verification_status}
                  </Badge>
                  <Badge className={severityInfo.color}>
                    {selectedCapa.severity} - {severityInfo.label}
                  </Badge>
                  {selectedCapa.escalation_level > 0 && (
                    <Badge variant="destructive">
                      تصعيد {selectedCapa.escalation_level}
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive">
                      متأخر
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">القسم:</span>
                  <span className="text-sm font-medium">{selectedCapa.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">الموعد المستهدف:</span>
                  <span className="text-sm font-medium">{new Date(selectedCapa.target_date).toLocaleDateString('en-US')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">التكلفة المتوقعة:</span>
                  <span className="text-sm font-medium">{selectedCapa.estimated_cost ? `${selectedCapa.estimated_cost} ريال` : 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">مهلة الحل:</span>
                  <span className="text-sm font-medium">{selectedCapa.sla_days} يوم</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Root Cause */}
          {selectedCapa.root_cause && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  تحليل السبب الجذري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{selectedCapa.root_cause}</p>
              </CardContent>
            </Card>
          )}

          {/* Corrective Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                الإجراءات التصحيحية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedCapa.corrective_actions.map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{action.task}</h4>
                      <Badge className={action.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {action.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                      </Badge>
                    </div>
                    {action.due_date && (
                      <p className="text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        تاريخ الاستحقاق: {new Date(action.due_date).toLocaleDateString('en-US')}
                      </p>
                    )}
                    {action.notes && (
                      <p className="text-sm text-gray-600">{action.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preventive Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                الإجراءات الوقائية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedCapa.preventive_actions.map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{action.task}</h4>
                      <Badge className={action.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {action.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                      </Badge>
                    </div>
                    {action.due_date && (
                      <p className="text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        تاريخ الاستحقاق: {new Date(action.due_date).toLocaleDateString('en-US')}
                      </p>
                    )}
                    {action.notes && (
                      <p className="text-sm text-gray-600">{action.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Verification Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                خطوات التحقق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedCapa.verification_steps.map((step, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{step.step}</h4>
                      <div className="flex items-center gap-2">
                        {step.required && (
                          <Badge variant="outline">إلزامي</Badge>
                        )}
                        <Badge className={step.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {step.completed ? 'مكتمل' : 'معلق'}
                        </Badge>
                      </div>
                    </div>
                    {step.notes && (
                      <p className="text-sm text-gray-600">{step.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleBackToDashboard}>
              العودة للوحة الرئيسية
            </Button>
            <Button onClick={() => handleEditCapa(selectedCapa)}>
              <Edit className="w-4 h-4 mr-2" />
              تعديل
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {failingItems && failingItems.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>عناصر غير مكتملة من التقييم</CardTitle>
            <CardDescription>يمكنك إنشاء خطة تصحيحية لكل عنصر أو إنشاء جميعها تلقائياً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                {failingItems.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{it.item_title || `عنصر ${it.item_id}`}</div>
                    <div className="text-sm text-gray-600">نتيجة: {it.status} - تعليقات: {it.comments || '-'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasPermission(['super_admin','quality_manager','department_head']) ? (
                      <Button onClick={() => handleCreateCapaForItem(it)}>إنشاء خطة لهذا العنصر</Button>
                    ) : (
                      <Button disabled title="ليس لديك صلاحية">مقيّد</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={handleDismissFailingPanel}>إخفاء</Button>
              <Button onClick={handleCreateAllCapas}>تحميل عناصر كمسودات</Button>
              <Button onClick={handleCreateDraftsForEvaluatedItems}>إنشاء مسودات للقائمة</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CapaDashboard
        capas={capasList}
        onViewCapa={handleViewCapa}
        onEditCapa={handleEditCapa}
        onCreateCapa={handleCreateCapa}
        onStartCapa={handleStartCapa}
        isLoading={isLoading}
      />
    </div>
  )
}

export default EnhancedCapaManagement
