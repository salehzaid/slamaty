import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Minus, HelpCircle, AlertTriangle } from 'lucide-react'
import CommentSuggestions from './CommentSuggestions'

interface EvaluationStepProps {
  item: any
  category: any
  currentStatus: string
  currentComment: string
  onStatusChange: (status: string) => void
  onCommentChange: (comment: string) => void
  isCompleted?: boolean
  itemIndex: number
  totalItems: number
}

const statusOptions = [
  { 
    value: 'applied', 
    label: 'مطبق بالكامل', 
    sublabel: '100%',
    icon: Check, 
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
  },
  { 
    value: 'high_partial', 
    label: 'مطبق بنسبة عالية', 
    sublabel: '75%',
    icon: Check, 
    color: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' 
  },
  { 
    value: 'partial', 
    label: 'مطبق جزئياً', 
    sublabel: '50%',
    icon: Minus, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' 
  },
  { 
    value: 'low_partial', 
    label: 'مطبق بنسبة منخفضة', 
    sublabel: '25%',
    icon: Minus, 
    color: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200' 
  },
  { 
    value: 'not_applied', 
    label: 'غير مطبق', 
    sublabel: '0%',
    icon: X, 
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' 
  },
  { 
    value: 'na', 
    label: 'لا ينطبق', 
    sublabel: 'N/A',
    icon: HelpCircle, 
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' 
  },
]

const EvaluationStep: React.FC<EvaluationStepProps> = ({
  item,
  category,
  currentStatus,
  currentComment,
  onStatusChange,
  onCommentChange,
  isCompleted = false,
  itemIndex,
  totalItems
}) => {
  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'MAJOR':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'MINOR':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'حرج'
      case 'MAJOR':
        return 'رئيسي'
      case 'MINOR':
        return 'بسيط'
      default:
        return 'غير محدد'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-300 text-red-700'
      case 'MAJOR':
        return 'bg-orange-50 border-orange-300 text-orange-700'
      case 'MINOR':
        return 'bg-yellow-50 border-yellow-300 text-yellow-700'
      default:
        return 'bg-gray-50 border-gray-300 text-gray-700'
    }
  }

  const getEvidenceTypeText = (type: string) => {
    switch (type) {
      case 'OBSERVATION':
        return 'مشاهدة'
      case 'DOCUMENT':
        return 'وثيقة'
      case 'INTERVIEW':
        return 'مقابلة'
      case 'MEASUREMENT':
        return 'قياس'
      default:
        return type || 'غير محدد'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`px-3 py-1 text-sm font-medium border-r-4 ${
                category?.color === 'yellow' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                category?.color === 'orange' ? 'bg-orange-50 border-orange-500 text-orange-800' :
                category?.color === 'green' ? 'bg-green-50 border-green-500 text-green-800' :
                category?.color === 'blue' ? 'bg-blue-50 border-blue-500 text-blue-800' :
                category?.color === 'red' ? 'bg-red-50 border-red-500 text-red-800' :
                'bg-gray-50 border-gray-500 text-gray-800'
              }`}
            >
              {category?.name || 'تصنيف غير محدد'}
            </Badge>
            <span className="text-sm text-gray-500">
              البند {itemIndex} من {totalItems}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {item.code && (
              <Badge variant="outline" className="text-xs bg-gray-50">
                {item.code}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
              الوزن: {item.weight || 1}
            </Badge>
          </div>
        </div>

        {/* Item Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-relaxed">
          {item.title}
        </h2>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Description */}
        {item.description && (
          <div className="p-4 bg-gray-50 rounded-lg border-r-4 border-gray-300">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>📋</span>
              تفاصيل العنصر
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {item.description}
            </p>
          </div>
        )}

        {/* Objective */}
        {item.objective && (
          <div className="p-4 bg-blue-50 rounded-lg border-r-4 border-blue-400">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <span>🎯</span>
              الهدف من التقييم
            </h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              {item.objective}
            </p>
          </div>
        )}

        {/* Guidance */}
        {item.guidance_ar && (
          <div className="p-4 bg-green-50 rounded-lg border-r-4 border-green-400">
            <h3 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
              <span>⭐</span>
              شرح التوجيه للمقيم
            </h3>
            <p className="text-sm text-green-700 leading-relaxed">
              {item.guidance_ar}
            </p>
          </div>
        )}

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2">
          {item.risk_level && (
            <Badge 
              variant="outline" 
              className={`text-xs flex items-center gap-1 ${getRiskLevelColor(item.risk_level)}`}
            >
              {getRiskLevelIcon(item.risk_level)}
              مستوى الخطورة: {getRiskLevelText(item.risk_level)}
            </Badge>
          )}
          
          {item.evidence_type && (
            <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
              نوع الدليل: {getEvidenceTypeText(item.evidence_type)}
            </Badge>
          )}
          
          {item.is_required && (
            <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
              مطلوب ⭐
            </Badge>
          )}

          {item.standard_version && (
            <Badge variant="outline" className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
              المعيار: {item.standard_version}
            </Badge>
          )}
        </div>
      </div>

      {/* Evaluation Section */}
      <div className="mt-8 space-y-6">
        {/* Status Selection */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            النتيجة
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {statusOptions.map((option) => {
              const IconComponent = option.icon
              const isSelected = currentStatus === option.value
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  disabled={isCompleted}
                  className={`flex flex-col items-center gap-2 h-20 p-3 ${
                    isSelected 
                      ? option.color 
                      : 'hover:bg-gray-50 border-gray-200'
                  } ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isCompleted && onStatusChange(option.value)}
                >
                  <IconComponent className="w-5 h-5" />
                  <div className="text-center">
                    <div className="text-xs font-medium">{option.label}</div>
                    <div className="text-xs opacity-75">{option.sublabel}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            الملاحظات
          </label>
          <CommentSuggestions
            value={currentComment}
            onChange={onCommentChange}
            evaluationItemId={item.id}
            categoryId={item.category_id}
            placeholder="أضف ملاحظاتك حول هذا العنصر..."
            className="w-full"
          />
        </div>
      </div>

      {/* Additional Status Info */}
      {(currentStatus === 'not_applied' || currentStatus === 'partial' || currentStatus === 'low_partial') && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border-r-4 border-yellow-400">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            💡 اقتراحات للتحسين
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {currentStatus === 'not_applied' && (
              <>
                <li>• تحقق من توفر الموارد المطلوبة</li>
                <li>• تأكد من تدريب الكادر على المعيار</li>
                <li>• راجع البنية التحتية الداعمة</li>
              </>
            )}
            {currentStatus === 'partial' && (
              <>
                <li>• حدد نقاط الضعف المحددة</li>
                <li>• اقترح خطوات تحسين ملموسة</li>
                <li>• حدد الموارد الإضافية المطلوبة</li>
              </>
            )}
            {currentStatus === 'low_partial' && (
              <>
                <li>• راجع أسباب التطبيق المحدود</li>
                <li>• خطط لتحسين تدريجي</li>
                <li>• حدد الأولويات للتحسين</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default EvaluationStep
