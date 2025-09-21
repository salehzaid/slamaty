import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Check, X, Minus, HelpCircle, Save, Send } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface EvaluateRoundFormProps {
  roundId: number
  onSubmit: (payload: any) => void
  onCancel: () => void
}

const statusOptions = [
  { value: 'applied', label: 'مطبق', icon: Check, color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'partial', label: 'مطبق جزئي', icon: Minus, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'not_applied', label: 'غير مطبق', icon: X, color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'na', label: 'لا ينطبق', icon: HelpCircle, color: 'bg-gray-100 text-gray-800 border-gray-200' },
]

const EvaluateRoundForm: React.FC<EvaluateRoundFormProps> = ({ roundId, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<Record<number, string>>({})
  const [comments, setComments] = useState<Record<number, string>>({})
  const [notes, setNotes] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [roundStatus, setRoundStatus] = useState<string>('')

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        console.log('🔍 Fetching round data for ID:', roundId)
        
        // Get round data with evaluation_items
        const r = await apiClient.getRound(roundId)
        const round = (r as any)?.data || (r as any)
        console.log('📋 Round data:', round)

        // Get all evaluation items and categories
        const [its, cats] = await Promise.all([
          apiClient.getEvaluationItems(),
          apiClient.getEvaluationCategories()
        ])
        const allItems = (its as any)?.data || (its as any)
        const allCategories = (cats as any)?.data || (cats as any)
        console.log('📝 All evaluation items:', allItems?.length || 0)
        console.log('📁 All evaluation categories:', allCategories?.length || 0)

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
        
        console.log('🎯 Round evaluation item IDs:', roundItemIds)

        // Filter items based on round's evaluation_items
        const filtered = Array.isArray(allItems) && roundItemIds.length > 0
          ? allItems.filter((it: any) => roundItemIds.includes(it.id))
          : []

        console.log('✅ Filtered items for evaluation:', filtered.length)

        if (!mounted) return
        setItems(filtered)
        setCategories(allCategories || [])
        setRoundStatus(round?.status || '')
        setCompletionPercentage(round?.completion_percentage || 0)

        // Initialize evaluation statuses to 'na' and empty comments
        const initialEvaluations: Record<number, string> = {}
        const initialComments: Record<number, string> = {}
        filtered.forEach((it: any) => { 
          initialEvaluations[it.id] = 'na'
          initialComments[it.id] = ''
        })

        // Try to load any previously saved evaluation results for this round
        try {
          const evRes = await apiClient.getRoundEvaluations(roundId)
          const evData = (evRes as any)?.data || (evRes as any)
          if (Array.isArray(evData) && evData.length > 0) {
            evData.forEach((res: any) => {
              const itemId = res.item_id || res.itemId || res.item_id
              // Map numeric score back to status
              let status = 'na'
              if (res.score === 100) status = 'applied'
              else if (res.score === 50) status = 'partial'
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
        console.error('❌ EvaluateRoundForm fetch error', err)
        setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [roundId])

  const handleStatusChange = (itemId: number, value: string) => {
    setEvaluations(prev => ({ ...prev, [itemId]: value }))
  }

  const handleCommentChange = (itemId: number, value: string) => {
    setComments(prev => ({ ...prev, [itemId]: value }))
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      roundId,
      evaluations: Object.keys(evaluations).map(key => ({ 
        item_id: Number(key), 
        status: evaluations[Number(key)],
        comments: comments[Number(key)] || ''
      })),
      notes
    }
    onSubmit(payload)
  }

  const handleSaveDraft = async () => {
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

      const response = await apiClient.saveEvaluationDraft(roundId, payload)
      const result = response && (response.data || response)
      const completion = result?.completion_percentage ?? result?.data?.completion_percentage
      if (completion !== undefined) {
        setCompletionPercentage(completion || 0)
      }
      // Exit the form automatically after saving draft
      onSubmit(payload)
    } catch (error: any) {
      console.error('Error saving draft:', error)
      const message = error?.message || (error && String(error)) || 'حدث خطأ أثناء حفظ التقييم'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

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

      const response = await apiClient.finalizeEvaluation(roundId, payload)
      const result = response && (response.data || response)
      if (result) {
        setCompletionPercentage(100)
        setRoundStatus('completed')
        alert('تم إرسال التقرير النهائي بنجاح')
        onSubmit(payload) // Call the original onSubmit to close the form
      }
    } catch (error: any) {
      console.error('Error finalizing evaluation:', error)
      const message = error?.message || (error && String(error)) || 'حدث خطأ أثناء إرسال التقرير النهائي'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate current completion percentage
  const calculateCurrentCompletion = () => {
    const evaluatedItems = Object.values(evaluations).filter(status => status !== 'na').length
    const totalItems = items.length
    return totalItems > 0 ? Math.round((evaluatedItems / totalItems) * 100) : 0
  }

  const isCompleted = roundStatus === 'completed'
  const currentCompletion = calculateCurrentCompletion()
  const allItemsEvaluated = currentCompletion === 100

  // Group items by category
  const groupedItems = React.useMemo(() => {
    const groups: Record<number, any[]> = {}
    items.forEach(item => {
      const categoryId = item.category_id
      if (!groups[categoryId]) {
        groups[categoryId] = []
      }
      groups[categoryId].push(item)
    })
    return groups
  }, [items])

  if (loading) return <div className="p-6">جاري تحميل عناصر التقييم...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">نموذج تقييم الجولة</CardTitle>
            <div className="text-sm text-gray-600">
              إجمالي العناصر: {items.length}
            </div>
          </div>
          
          {/* Progress Section */}
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">نسبة اكتمال التقييم</span>
              <span className="text-sm font-bold text-blue-600">{currentCompletion}%</span>
            </div>
            <Progress value={currentCompletion} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>العناصر المكتملة: {Object.values(evaluations).filter(status => status !== 'na').length}</span>
              <span>إجمالي العناصر: {items.length}</span>
            </div>
          </div>

          {/* Status Badge */}
          {isCompleted && (
            <div className="mt-3">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Check className="w-4 h-4 mr-1" />
                مكتملة - غير قابلة للتعديل
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <div className="text-lg font-medium">لا توجد عناصر تقييم مرتبطة بهذه الجولة</div>
                  <div className="text-sm">يرجى التأكد من اختيار عناصر التقييم عند إنشاء الجولة</div>
                </div>
                <Button type="button" variant="outline" onClick={onCancel}>
                  العودة
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedItems).map(([categoryId, categoryItems]) => {
                  const category = categories.find(cat => cat.id === parseInt(categoryId))
                  if (!category) return null
                  
                  return (
                    <div key={categoryId} className="space-y-4">
                      {/* Category Header */}
                      <div className={`p-4 rounded-lg border-r-4 ${
                        category.color === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
                        category.color === 'orange' ? 'bg-orange-50 border-orange-500' :
                        category.color === 'green' ? 'bg-green-50 border-green-500' :
                        category.color === 'blue' ? 'bg-blue-50 border-blue-500' :
                        'bg-gray-50 border-gray-500'
                      }`}>
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        )}
                        <Badge variant="secondary" className="mt-2">
                          {categoryItems.length} عنصر
                        </Badge>
                      </div>
                      
                      {/* Items in this category */}
                      <div className="space-y-6">
                        {categoryItems.map((item, index) => {
                          const currentStatus = evaluations[item.id] || 'na'
                          return (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
                              {/* Item Header */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-gray-500">البند {index + 1} من {categoryItems.length}</span>
                                    <Badge variant="outline" className="text-xs">
                                      الوزن: {item.weight || 1}
                                    </Badge>
                                  </div>
                                  <h4 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h4>
                                  {item.description && (
                                    <p className="text-sm text-gray-600">{item.description}</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Status Selection */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">النتيجة</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {statusOptions.map((option) => {
                                    const IconComponent = option.icon
                                    const isSelected = currentStatus === option.value
                                    return (
                                      <Button
                                        key={option.value}
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        disabled={isCompleted}
                                        className={`flex flex-col items-center gap-2 h-16 p-3 ${
                                          isSelected 
                                            ? option.color 
                                            : 'hover:bg-gray-50'
                                        } ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => !isCompleted && handleStatusChange(item.id, option.value)}
                                      >
                                        <IconComponent className="w-5 h-5" />
                                        <span className="text-xs font-medium">{option.label}</span>
                                      </Button>
                                    )
                                  })}
                                </div>
                              </div>
                              
                              {/* Comments */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                                <Textarea
                                  value={comments[item.id] || ''}
                                  onChange={(e) => !isCompleted && handleCommentChange(item.id, e.target.value)}
                                  placeholder="أضف ملاحظاتك هنا...."
                                  disabled={isCompleted}
                                  className={`min-h-[80px] resize-none ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                              </div>

                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* General Notes */}
            {items.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات عامة</label>
                <Textarea
                  value={notes}
                  onChange={(e) => !isCompleted && setNotes(e.target.value)}
                  placeholder="أضف ملاحظات عامة حول التقييم..."
                  disabled={isCompleted}
                  className={`min-h-[100px] ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            )}

            {/* Submit Buttons */}
            {items.length > 0 && (
              <div className="space-y-3 pt-4">
                {!isCompleted && (
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      onClick={handleSaveDraft}
                      disabled={saving}
                      variant="outline"
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'جاري الحفظ...' : 'حفظ مسودة'}
                    </Button>
                    
                    {allItemsEvaluated && (
                      <Button 
                        type="button" 
                        onClick={handleFinalize}
                        disabled={saving}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {saving ? 'جاري الإرسال...' : 'إرسال التقرير'}
                      </Button>
                    )}
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onCancel} 
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                )}
                
                {isCompleted && (
                  <div className="text-center py-4">
                    <Badge className="bg-green-100 text-green-800 border-green-200 mb-3">
                      <Check className="w-4 h-4 mr-1" />
                      تم إرسال التقرير النهائي
                    </Badge>
                    <div className="flex justify-center gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onCancel} 
                        className="px-8"
                      >
                        إغلاق
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EvaluateRoundForm


