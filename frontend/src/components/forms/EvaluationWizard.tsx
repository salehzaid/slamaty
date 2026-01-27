import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send, 
  Check, 
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react'
import ProgressBar from '@/components/ui/ProgressBar'
import EvaluationStep from './EvaluationStep'
import { useAutoSave } from '@/hooks/useAutoSave'
import { apiClient } from '@/lib/api'

interface EvaluationWizardProps {
  roundId: number
  onSubmit: (payload: any) => void
  onCancel: () => void
}

const EvaluationWizard: React.FC<EvaluationWizardProps> = ({ 
  roundId, 
  onSubmit, 
  onCancel 
}) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [evaluations, setEvaluations] = useState<Record<number, string>>({})
  const [comments, setComments] = useState<Record<number, string>>({})
  const [notes] = useState('')
  const [roundStatus, setRoundStatus] = useState<string>('')
  const [showReviewMode, setShowReviewMode] = useState(false)

  // Auto-save functionality
  const saveEvaluationData = useCallback(async () => {
    if (saving || items.length === 0) return

    try {
      const payload = {
        evaluations: Object.keys(evaluations).map(key => ({ 
          item_id: Number(key), 
          status: evaluations[Number(key)],
          comments: comments[Number(key)] || ''
        })),
        notes
      }

      // TODO: Implement saveEvaluationDraft API method
      console.log('Saving draft:', payload)
    } catch (error) {
      console.error('Auto-save failed:', error)
      throw error
    }
  }, [evaluations, comments, notes, roundId, saving, items.length])

  const { saveStatus, saveNow } = useAutoSave({
    interval: 30000, // 30 seconds
    onSave: saveEvaluationData,
    onError: (error) => {
      console.error('Auto-save error:', error)
    }
  })

  // Load data
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        console.log('🔍 Fetching round data for ID:', roundId)
        
        const [roundRes, itemsRes, categoriesRes] = await Promise.all([
          apiClient.getRound(roundId),
          apiClient.getEvaluationItems(),
          apiClient.getEvaluationCategories()
        ])
        
        const round = (roundRes as any)?.data || (roundRes as any)
        const allItems = (itemsRes as any)?.data || (itemsRes as any)
        const allCategories = (categoriesRes as any)?.data || (categoriesRes as any)

        // Extract evaluation item IDs from round
        let roundItemIds: number[] = []
        if (round?.evaluation_items) {
          if (Array.isArray(round.evaluation_items)) {
            roundItemIds = round.evaluation_items
          } else if (typeof round.evaluation_items === 'string') {
            try { 
              roundItemIds = JSON.parse(round.evaluation_items) 
            } catch (e) { 
              console.error('Failed to parse evaluation_items JSON:', e)
              roundItemIds = [] 
            }
          }
        }

        // Filter items based on round's evaluation_items
        const filtered = Array.isArray(allItems) && roundItemIds.length > 0
          ? allItems.filter((it: any) => roundItemIds.includes(it.id))
          : []

        if (!mounted) return

        setItems(filtered)
        setCategories(allCategories || [])
        setRoundStatus(round?.status || '')

        // Initialize evaluation statuses and load existing data
        const initialEvaluations: Record<number, string> = {}
        const initialComments: Record<number, string> = {}
        
        filtered.forEach((it: any) => { 
          initialEvaluations[it.id] = 'na'
          initialComments[it.id] = ''
        })

        // Load existing evaluation results
        try {
          // TODO: Implement getRoundEvaluations API method
          const evData = [] // Mock data for now
          if (Array.isArray(evData) && evData.length > 0) {
            evData.forEach((res: any) => {
              const itemId = res.item_id || res.itemId || res.item_id
              let status = 'na'
              if (res.score === 100) status = 'applied'
              else if (res.score === 75) status = 'high_partial'
              else if (res.score === 50) status = 'partial'
              else if (res.score === 25) status = 'low_partial'
              else if (res.score === 0) status = 'not_applied'

              if (itemId && initialEvaluations.hasOwnProperty(itemId)) {
                initialEvaluations[itemId] = status
                initialComments[itemId] = res.comments || ''
              }
            })
          }
        } catch (e) {
          console.warn('Could not load prior evaluation results:', e)
        }

        setEvaluations(initialEvaluations)
        setComments(initialComments)
      } catch (err) {
        console.error('❌ EvaluationWizard fetch error', err)
        setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [roundId])

  // Navigation functions
  const goToStep = (step: number) => {
    if (step >= 1 && step <= items.length) {
      setCurrentStep(step)
    }
  }

  const goToNext = () => {
    if (currentStep < items.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Event handlers
  const handleStatusChange = (itemId: number, status: string) => {
    setEvaluations(prev => ({ ...prev, [itemId]: status }))
  }

  const handleCommentChange = (itemId: number, comment: string) => {
    setComments(prev => ({ ...prev, [itemId]: comment }))
  }

  // Save draft
  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await saveNow()
      alert('تم حفظ المسودة بنجاح')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('حدث خطأ أثناء حفظ المسودة')
    } finally {
      setSaving(false)
    }
  }

  // Finalize evaluation
  const handleFinalize = async () => {
    setSaving(true)
    try {
      const payload = {
        evaluations: Object.keys(evaluations).map(key => ({ 
          item_id: Number(key), 
          status: evaluations[Number(key)],
          comments: comments[Number(key)] || ''
        })),
        notes
      }

      await apiClient.finalizeEvaluation(roundId, payload)
      alert('تم إرسال التقرير النهائي بنجاح')
      onSubmit(payload)
    } catch (error) {
      console.error('Error finalizing evaluation:', error)
      alert('حدث خطأ أثناء إرسال التقرير النهائي')
    } finally {
      setSaving(false)
    }
  }

  // Calculate completion
  const calculateCompletion = () => {
    const evaluatedItems = Object.values(evaluations).filter(status => status !== 'na').length
    const totalItems = items.length
    return totalItems > 0 ? Math.round((evaluatedItems / totalItems) * 100) : 0
  }

  const getCompletedSteps = () => {
    return Object.keys(evaluations)
      .map(Number)
      .filter(itemId => evaluations[itemId] !== 'na')
      .map(itemId => items.findIndex(item => item.id === itemId) + 1)
      .filter(step => step > 0)
  }

  const getEvaluationStats = () => {
    const stats = {
      applied: 0,
      partial: 0,
      not_applied: 0,
      na: 0
    }

    Object.values(evaluations).forEach(status => {
      if (status === 'applied' || status === 'high_partial') stats.applied++
      else if (status === 'partial' || status === 'low_partial') stats.partial++
      else if (status === 'not_applied') stats.not_applied++
      else if (status === 'na') stats.na++
    })

    return stats
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return // Ignore Ctrl/Cmd combinations
      
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault()
          goToNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case '1':
          if (currentItem) handleStatusChange(currentItem.id, 'applied')
          break
        case '2':
          if (currentItem) handleStatusChange(currentItem.id, 'partial')
          break
        case '3':
          if (currentItem) handleStatusChange(currentItem.id, 'not_applied')
          break
        case '4':
          if (currentItem) handleStatusChange(currentItem.id, 'na')
          break
        case 'Escape':
          onCancel()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentStep, items])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل عناصر التقييم...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              لا توجد عناصر تقييم
            </h2>
            <p className="text-gray-600 mb-6">
              لا توجد عناصر تقييم مرتبطة بهذه الجولة
            </p>
            <Button onClick={onCancel}>
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentItem = items[currentStep - 1]
  const currentCategory = categories.find(cat => cat.id === currentItem?.category_id)
  const isCompleted = roundStatus === 'completed'
  const completion = calculateCompletion()
  const completedSteps = getCompletedSteps()
  const stats = getEvaluationStats()
  const allItemsEvaluated = completion === 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                تقييم الجولة #{roundId}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>العناصر: {items.length}</span>
                <span>التقدم: {completion}%</span>
                {saveStatus === 'saving' && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    جاري الحفظ...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    تم الحفظ
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    خطأ في الحفظ
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewMode(!showReviewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showReviewMode ? 'إخفاء المراجعة' : 'مراجعة سريعة'}
              </Button>
              
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  مكتملة
                </Badge>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar
            current={currentStep}
            total={items.length}
            completed={completedSteps}
            onStepClick={goToStep}
          />

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="text-green-600">مطبق: {stats.applied}</span>
            <span className="text-yellow-600">جزئي: {stats.partial}</span>
            <span className="text-red-600">غير مطبق: {stats.not_applied}</span>
            <span className="text-gray-600">لا ينطبق: {stats.na}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {showReviewMode ? (
          /* Review Mode */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              مراجعة جميع العناصر
            </h2>
            {items.map((item, index) => {
              const category = categories.find(cat => cat.id === item.category_id)
              const status = evaluations[item.id] || 'na'
              const comment = comments[item.id] || ''
              
              return (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setCurrentStep(index + 1)
                        setShowReviewMode(false)
                      }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}/{items.length}
                          </Badge>
                          {category && (
                            <Badge variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {item.code}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        {comment && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {comment}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <Badge 
                          className={
                            status === 'applied' || status === 'high_partial' ? 'bg-green-100 text-green-800' :
                            status === 'partial' || status === 'low_partial' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'not_applied' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {status === 'applied' ? 'مطبق' :
                           status === 'high_partial' ? 'مطبق عالياً' :
                           status === 'partial' ? 'جزئي' :
                           status === 'low_partial' ? 'مطبق قليلاً' :
                           status === 'not_applied' ? 'غير مطبق' :
                           'لا ينطبق'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Wizard Mode */
          <Card>
            <CardContent className="p-0">
              <EvaluationStep
                item={currentItem}
                category={currentCategory}
                currentStatus={evaluations[currentItem?.id] || 'na'}
                currentComment={comments[currentItem?.id] || ''}
                onStatusChange={(status) => handleStatusChange(currentItem.id, status)}
                onCommentChange={(comment) => handleCommentChange(currentItem.id, comment)}
                isCompleted={isCompleted}
                itemIndex={currentStep}
                totalItems={items.length}
              />
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {!showReviewMode && (
          <div className="flex items-center justify-between mt-8 p-6 bg-white rounded-lg border border-gray-200">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentStep === 1 || isCompleted}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              السابق
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || isCompleted}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ مسودة'}
              </Button>

              {allItemsEvaluated && (
                <Button
                  onClick={handleFinalize}
                  disabled={saving || isCompleted}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  {saving ? 'جاري الإرسال...' : 'إرسال التقرير'}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={currentStep === items.length || isCompleted}
              className="flex items-center gap-2"
            >
              التالي
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            اختصارات لوحة المفاتيح
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>← → : التنقل بين العناصر</div>
            <div>1-4 : اختيار خيار التقييم</div>
            <div>Esc : إلغاء والخروج</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EvaluationWizard
