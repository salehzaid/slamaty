import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Check,
    X,
    Minus,
    HelpCircle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Info,
    Target,
    BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EvaluationMainPanelProps {
    item: any
    category: any
    currentStatus: string
    currentComment: string
    onStatusChange: (status: string) => void
    onCommentChange: (comment: string) => void
    isCompleted?: boolean
    itemIndex: number
    totalItems: number
    onPrevious: () => void
    onNext: () => void
    hasPrevious: boolean
    hasNext: boolean
}

const statusOptions = [
    {
        value: 'applied',
        label: 'مطبق',
        sublabel: '100%',
        icon: Check,
        color: 'bg-green-500 hover:bg-green-600 text-white border-green-600',
        selectedRing: 'ring-green-300'
    },
    {
        value: 'high_partial',
        label: 'مطبق عالياً',
        sublabel: '75%',
        icon: Check,
        color: 'bg-green-400 hover:bg-green-500 text-white border-green-500',
        selectedRing: 'ring-green-200'
    },
    {
        value: 'partial',
        label: 'جزئي',
        sublabel: '50%',
        icon: Minus,
        color: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600',
        selectedRing: 'ring-yellow-300'
    },
    {
        value: 'low_partial',
        label: 'مطبق قليلاً',
        sublabel: '25%',
        icon: Minus,
        color: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600',
        selectedRing: 'ring-orange-300'
    },
    {
        value: 'not_applied',
        label: 'غير مطبق',
        sublabel: '0%',
        icon: X,
        color: 'bg-red-500 hover:bg-red-600 text-white border-red-600',
        selectedRing: 'ring-red-300'
    },
    {
        value: 'na',
        label: 'لا ينطبق',
        sublabel: 'N/A',
        icon: HelpCircle,
        color: 'bg-gray-400 hover:bg-gray-500 text-white border-gray-500',
        selectedRing: 'ring-gray-300'
    },
]

const EvaluationMainPanel: React.FC<EvaluationMainPanelProps> = ({
    item,
    category,
    currentStatus,
    currentComment,
    onStatusChange,
    onCommentChange,
    isCompleted = false,
    itemIndex,
    totalItems,
    onPrevious,
    onNext,
    hasPrevious,
    hasNext
}) => {
    if (!item) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <Info className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">اختر بنداً من القائمة للبدء</p>
                </div>
            </div>
        )
    }

    const getCategoryBadgeColor = (color: string) => {
        const colors: Record<string, string> = {
            yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            orange: 'bg-orange-100 text-orange-800 border-orange-300',
            green: 'bg-green-100 text-green-800 border-green-300',
            blue: 'bg-blue-100 text-blue-800 border-blue-300',
            red: 'bg-red-100 text-red-800 border-red-300',
            purple: 'bg-purple-100 text-purple-800 border-purple-300',
        }
        return colors[color] || 'bg-gray-100 text-gray-800 border-gray-300'
    }

    const getRiskLevelBadge = (level: string) => {
        switch (level) {
            case 'CRITICAL':
                return <Badge className="bg-red-100 text-red-800 border-red-300">⚠️ حرج</Badge>
            case 'MAJOR':
                return <Badge className="bg-orange-100 text-orange-800 border-orange-300">⚡ رئيسي</Badge>
            case 'MINOR':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">💡 بسيط</Badge>
            default:
                return null
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Badge
                            variant="outline"
                            className={cn("px-3 py-1 text-sm font-medium", getCategoryBadgeColor(category?.color))}
                        >
                            {category?.name || 'تصنيف غير محدد'}
                        </Badge>
                        {item.code && (
                            <Badge variant="outline" className="bg-gray-50 font-mono text-xs">
                                {item.code}
                            </Badge>
                        )}
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            الوزن: {item.weight || 1}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                            البند {itemIndex} من {totalItems}
                        </span>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 leading-relaxed">
                    {item.title}
                </h1>

                {/* Badges row */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {item.risk_level && getRiskLevelBadge(item.risk_level)}
                    {item.is_required && (
                        <Badge className="bg-red-50 text-red-700 border-red-200">مطلوب ⭐</Badge>
                    )}
                    {item.evidence_type && (
                        <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                            نوع الدليل: {
                                item.evidence_type === 'OBSERVATION' ? 'مشاهدة' :
                                    item.evidence_type === 'DOCUMENT' ? 'وثيقة' :
                                        item.evidence_type === 'INTERVIEW' ? 'مقابلة' :
                                            'قياس'
                            }
                        </Badge>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Description Card */}
                    {item.description && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 text-gray-700">
                                <Info className="w-5 h-5 text-gray-500" />
                                <h3 className="font-semibold">تفاصيل العنصر</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed">{item.description}</p>
                        </div>
                    )}

                    {/* Objective Card */}
                    {item.objective && (
                        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
                            <div className="flex items-center gap-2 mb-3 text-blue-800">
                                <Target className="w-5 h-5" />
                                <h3 className="font-semibold">الهدف من التقييم</h3>
                            </div>
                            <p className="text-blue-700 leading-relaxed">{item.objective}</p>
                        </div>
                    )}

                    {/* Guidance Card */}
                    {item.guidance_ar && (
                        <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
                            <div className="flex items-center gap-2 mb-3 text-green-800">
                                <BookOpen className="w-5 h-5" />
                                <h3 className="font-semibold">شرح التوجيه للمقيم</h3>
                            </div>
                            <p className="text-green-700 leading-relaxed">{item.guidance_ar}</p>
                        </div>
                    )}

                    {/* Status Selection */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">اختر نتيجة التقييم</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {statusOptions.map((option) => {
                                const IconComponent = option.icon
                                const isSelected = currentStatus === option.value
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={isCompleted}
                                        onClick={() => !isCompleted && onStatusChange(option.value)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                            isSelected
                                                ? `${option.color} ring-4 ${option.selectedRing} shadow-lg transform scale-105`
                                                : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-600",
                                            isCompleted && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <IconComponent className={cn("w-6 h-6", isSelected ? "text-white" : "")} />
                                        <div className="text-center">
                                            <div className={cn("text-sm font-bold", isSelected ? "text-white" : "text-gray-700")}>
                                                {option.label}
                                            </div>
                                            <div className={cn("text-xs", isSelected ? "text-white/80" : "text-gray-500")}>
                                                {option.sublabel}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">الملاحظات</h3>
                        <Textarea
                            value={currentComment}
                            onChange={(e) => !isCompleted && onCommentChange(e.target.value)}
                            placeholder="أضف ملاحظاتك حول هذا العنصر..."
                            disabled={isCompleted}
                            className={cn(
                                "min-h-[120px] text-base resize-none rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500",
                                isCompleted && "opacity-50 cursor-not-allowed"
                            )}
                        />
                    </div>

                    {/* Improvement Suggestions */}
                    {(currentStatus === 'not_applied' || currentStatus === 'partial' || currentStatus === 'low_partial') && (
                        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                            <div className="flex items-center gap-2 mb-3 text-amber-800">
                                <AlertTriangle className="w-5 h-5" />
                                <h3 className="font-semibold">اقتراحات للتحسين</h3>
                            </div>
                            <ul className="text-amber-700 space-y-2">
                                {currentStatus === 'not_applied' && (
                                    <>
                                        <li>• تحقق من توفر الموارد المطلوبة</li>
                                        <li>• تأكد من تدريب الكادر على المعيار</li>
                                        <li>• راجع البنية التحتية الداعمة</li>
                                    </>
                                )}
                                {(currentStatus === 'partial' || currentStatus === 'low_partial') && (
                                    <>
                                        <li>• حدد نقاط الضعف المحددة</li>
                                        <li>• اقترح خطوات تحسين ملموسة</li>
                                        <li>• حدد الموارد الإضافية المطلوبة</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="bg-white border-t border-gray-200 px-8 py-4 shadow-lg">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={onPrevious}
                        disabled={!hasPrevious || isCompleted}
                        className="flex items-center gap-2 px-6"
                    >
                        <ChevronRight className="w-4 h-4" />
                        السابق
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            اختصارات: 1-6 لاختيار النتيجة، ← → للتنقل
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        onClick={onNext}
                        disabled={!hasNext || isCompleted}
                        className="flex items-center gap-2 px-6"
                    >
                        التالي
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default EvaluationMainPanel
