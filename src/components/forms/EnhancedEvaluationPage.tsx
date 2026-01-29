import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Save,
    Send,
    X,
    Check,
    AlertTriangle,
    Loader2,
    LayoutPanelLeft,
    Maximize2,
    Minimize2
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import EvaluationSidebar from './EvaluationSidebar'
import EvaluationMainPanel from './EvaluationMainPanel'
import { cn } from '@/lib/utils'

interface EnhancedEvaluationPageProps {
    roundId: number
    onSubmit: (payload: any) => void
    onCancel: () => void
}

const EnhancedEvaluationPage: React.FC<EnhancedEvaluationPageProps> = ({
    roundId,
    onSubmit,
    onCancel
}) => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [items, setItems] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [roundData, setRoundData] = useState<any>(null)
    const [evaluations, setEvaluations] = useState<Record<number, string>>({})
    const [comments, setComments] = useState<Record<number, string>>({})
    const [notes] = useState('')
    const [currentItemId, setCurrentItemId] = useState<number | null>(null)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [roundStatus, setRoundStatus] = useState<string>('')

    // Load data
    useEffect(() => {
        let mounted = true
        const fetchData = async () => {
            try {
                console.log('🔍 Enhanced Evaluation: Fetching round data for ID:', roundId)

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

                // Sort items by category for consistent order
                const sortedItems = [...filtered].sort((a, b) => {
                    if (a.category_id !== b.category_id) {
                        return a.category_id - b.category_id
                    }
                    return (a.order || 0) - (b.order || 0)
                })

                if (!mounted) return

                setItems(sortedItems)
                setCategories(allCategories || [])
                setRoundData(round)
                setRoundStatus(round?.status || '')

                // Set first item as current
                if (sortedItems.length > 0) {
                    setCurrentItemId(sortedItems[0].id)
                }

                // Initialize evaluation statuses
                const initialEvaluations: Record<number, string> = {}
                const initialComments: Record<number, string> = {}

                sortedItems.forEach((it: any) => {
                    initialEvaluations[it.id] = 'na'
                    initialComments[it.id] = ''
                })

                // Load existing evaluation results
                try {
                    const evRes = await apiClient.getRoundEvaluations(roundId)
                    const evData = (evRes as any)?.data || (evRes as any)
                    if (Array.isArray(evData) && evData.length > 0) {
                        evData.forEach((res: any) => {
                            const itemId = res.item_id || res.itemId
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
                console.error('❌ EnhancedEvaluationPage fetch error', err)
                setItems([])
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchData()
        return () => { mounted = false }
    }, [roundId])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            if (e.ctrlKey || e.metaKey) return

            const currentIndex = items.findIndex(item => item.id === currentItemId)
            const currentItem = items[currentIndex]

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault()
                    if (currentIndex < items.length - 1) {
                        setCurrentItemId(items[currentIndex + 1].id)
                    }
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    if (currentIndex > 0) {
                        setCurrentItemId(items[currentIndex - 1].id)
                    }
                    break
                case '1':
                    if (currentItem) handleStatusChange(currentItem.id, 'applied')
                    break
                case '2':
                    if (currentItem) handleStatusChange(currentItem.id, 'high_partial')
                    break
                case '3':
                    if (currentItem) handleStatusChange(currentItem.id, 'partial')
                    break
                case '4':
                    if (currentItem) handleStatusChange(currentItem.id, 'low_partial')
                    break
                case '5':
                    if (currentItem) handleStatusChange(currentItem.id, 'not_applied')
                    break
                case '6':
                    if (currentItem) handleStatusChange(currentItem.id, 'na')
                    break
                case 'Escape':
                    onCancel()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [currentItemId, items, onCancel])

    const handleStatusChange = (itemId: number, status: string) => {
        setEvaluations(prev => ({ ...prev, [itemId]: status }))
    }

    const handleCommentChange = (itemId: number, comment: string) => {
        setComments(prev => ({ ...prev, [itemId]: comment }))
    }

    const handleItemSelect = (itemId: number) => {
        setCurrentItemId(itemId)
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

            await apiClient.saveEvaluationDraft(roundId, payload)
            alert('تم حفظ المسودة بنجاح')
        } catch (error: any) {
            console.error('Error saving draft:', error)
            alert(error?.message || 'حدث خطأ أثناء حفظ المسودة')
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

            await apiClient.finalizeEvaluation(roundId, payload)
            setRoundStatus('completed')
            onSubmit(payload)
        } catch (error: any) {
            console.error('Error finalizing evaluation:', error)
            alert(error?.message || 'حدث خطأ أثناء إرسال التقرير')
        } finally {
            setSaving(false)
        }
    }

    // Calculate stats
    const calculateCompletion = () => {
        const evaluatedItems = Object.values(evaluations).filter(status => status !== 'na').length
        return items.length > 0 ? Math.round((evaluatedItems / items.length) * 100) : 0
    }

    const getStats = () => {
        let applied = 0, partial = 0, notApplied = 0, pending = 0
        Object.values(evaluations).forEach(status => {
            if (status === 'applied' || status === 'high_partial') applied++
            else if (status === 'partial' || status === 'low_partial') partial++
            else if (status === 'not_applied') notApplied++
            else pending++
        })
        return { applied, partial, notApplied, pending }
    }

    const currentIndex = items.findIndex(item => item.id === currentItemId)
    const currentItem = items[currentIndex]
    const currentCategory = categories.find(cat => cat.id === currentItem?.category_id)
    const isCompleted = roundStatus === 'completed'
    const completion = calculateCompletion()
    const stats = getStats()
    const allItemsEvaluated = completion === 100

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
                    <p className="text-gray-600 text-lg">جاري تحميل بيانات التقييم...</p>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-12 rounded-2xl shadow-lg max-w-md">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">لا توجد عناصر تقييم</h2>
                    <p className="text-gray-600 mb-6">لا توجد عناصر تقييم مرتبطة بهذه الجولة</p>
                    <Button onClick={onCancel}>العودة</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* Fixed Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm z-50">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left: Round Info */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="hidden md:flex"
                            >
                                {sidebarCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </Button>

                            <div>
                                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <LayoutPanelLeft className="w-5 h-5 text-indigo-600" />
                                    تقييم الجولة #{roundId}
                                </h1>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span>{roundData?.department || 'القسم'}</span>
                                    <span>•</span>
                                    <span>{roundData?.round_code || ''}</span>
                                </div>
                            </div>
                        </div>

                        {/* Center: Progress */}
                        <div className="hidden lg:flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-indigo-600">{completion}%</div>
                                    <div className="text-xs text-gray-500">مكتمل</div>
                                </div>
                                <div className="w-48">
                                    <Progress value={completion} className="h-3" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1 text-green-600">
                                    <Check className="w-4 h-4" />
                                    {stats.applied}
                                </span>
                                <span className="flex items-center gap-1 text-yellow-600">
                                    {stats.partial}
                                </span>
                                <span className="flex items-center gap-1 text-red-600">
                                    <X className="w-4 h-4" />
                                    {stats.notApplied}
                                </span>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                            {isCompleted ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
                                    <Check className="w-4 h-4 mr-1" />
                                    مكتملة
                                </Badge>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        disabled={saving}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'جاري الحفظ...' : 'حفظ مسودة'}
                                    </Button>

                                    {allItemsEvaluated && (
                                        <Button
                                            onClick={handleFinalize}
                                            disabled={saving}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            <Send className="w-4 h-4" />
                                            {saving ? 'جاري الإرسال...' : 'إرسال التقرير'}
                                        </Button>
                                    )}
                                </>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCancel}
                                className="text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className={cn(
                    "hidden md:flex transition-all duration-300",
                    sidebarCollapsed ? "w-12" : "w-80"
                )}>
                    <EvaluationSidebar
                        categories={categories}
                        items={items}
                        evaluations={evaluations}
                        currentItemId={currentItemId}
                        onItemSelect={handleItemSelect}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        isCollapsed={sidebarCollapsed}
                    />
                </div>

                {/* Main Panel */}
                <EvaluationMainPanel
                    item={currentItem}
                    category={currentCategory}
                    currentStatus={evaluations[currentItemId!] || 'na'}
                    currentComment={comments[currentItemId!] || ''}
                    onStatusChange={(status) => handleStatusChange(currentItemId!, status)}
                    onCommentChange={(comment) => handleCommentChange(currentItemId!, comment)}
                    isCompleted={isCompleted}
                    itemIndex={currentIndex + 1}
                    totalItems={items.length}
                    onPrevious={() => {
                        if (currentIndex > 0) {
                            setCurrentItemId(items[currentIndex - 1].id)
                        }
                    }}
                    onNext={() => {
                        if (currentIndex < items.length - 1) {
                            setCurrentItemId(items[currentIndex + 1].id)
                        }
                    }}
                    hasPrevious={currentIndex > 0}
                    hasNext={currentIndex < items.length - 1}
                />
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (currentIndex > 0) {
                                setCurrentItemId(items[currentIndex - 1].id)
                            }
                        }}
                        disabled={currentIndex === 0}
                    >
                        السابق
                    </Button>

                    <div className="text-center">
                        <div className="text-sm font-medium">{currentIndex + 1} / {items.length}</div>
                        <div className="text-xs text-gray-500">{completion}% مكتمل</div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (currentIndex < items.length - 1) {
                                setCurrentItemId(items[currentIndex + 1].id)
                            }
                        }}
                        disabled={currentIndex === items.length - 1}
                    >
                        التالي
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default EnhancedEvaluationPage
