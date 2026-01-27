import React, { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, Plus, Clock, Star, Target } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface CommentTemplate {
  id: number
  comment_text_ar: string
  comment_text_en?: string
  usage_count: number
  category?: string
  is_recent?: boolean
}

interface CommentSuggestionsProps {
  value: string
  onChange: (value: string) => void
  evaluationItemId?: number
  categoryId?: number
  placeholder?: string
  className?: string
}

const CommentSuggestions: React.FC<CommentSuggestionsProps> = ({
  value,
  onChange,
  evaluationItemId,
  categoryId,
  placeholder = "أضف ملاحظاتك هنا...",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<CommentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState('')

  // Load suggestions when dropdown opens
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      loadSuggestions()
    }
  }, [isOpen])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      // In the future, this will call the API
      // For now, we'll use mock data
      const mockSuggestions: CommentTemplate[] = [
        {
          id: 1,
          comment_text_ar: "لم يتم تطبيق المعيار بالكامل",
          usage_count: 15,
          category: "عام"
        },
        {
          id: 2,
          comment_text_ar: "نقص في التدريب على المعيار",
          usage_count: 12,
          category: "تدريب"
        },
        {
          id: 3,
          comment_text_ar: "الموارد غير متوفرة",
          usage_count: 8,
          category: "موارد"
        },
        {
          id: 4,
          comment_text_ar: "تم التطبيق بنجاح",
          usage_count: 25,
          category: "إيجابي"
        },
        {
          id: 5,
          comment_text_ar: "يحتاج متابعة مستمرة",
          usage_count: 6,
          is_recent: true
        }
      ]
      
      setSuggestions(mockSuggestions)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: CommentTemplate) => {
    onChange(suggestion.comment_text_ar)
    setIsOpen(false)
    
    // In the future, increment usage count
    console.log('Used suggestion:', suggestion.id)
  }

  const handleAddTemplate = async () => {
    if (!newTemplate.trim()) return
    
    try {
      // In the future, save to database
      const newSuggestion: CommentTemplate = {
        id: Date.now(),
        comment_text_ar: newTemplate.trim(),
        usage_count: 1,
        is_recent: true
      }
      
      setSuggestions(prev => [newSuggestion, ...prev])
      setNewTemplate('')
      setShowAddTemplate(false)
      
      // Add to current value
      const currentValue = value ? `${value}\n${newTemplate.trim()}` : newTemplate.trim()
      onChange(currentValue)
      
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'عام': return <Target className="w-3 h-3" />
      case 'تدريب': return <Star className="w-3 h-3" />
      case 'موارد': return <Clock className="w-3 h-3" />
      case 'إيجابي': return <Star className="w-3 h-3" />
      default: return null
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Textarea */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        onFocus={() => setIsOpen(true)}
      />

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Header */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">الملاحظات الشائعة</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddTemplate(!showAddTemplate)}
                className="h-6 px-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                إضافة
              </Button>
            </div>
          </div>

          {/* Add Template Form */}
          {showAddTemplate && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="space-y-2">
                <textarea
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  placeholder="أضف ملاحظة جديدة..."
                  className="w-full p-2 text-sm border border-gray-200 rounded resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddTemplate}
                    disabled={!newTemplate.trim()}
                    className="h-6 px-2 text-xs"
                  >
                    حفظ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddTemplate(false)
                      setNewTemplate('')
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          <div className="max-h-40 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                جاري التحميل...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                لا توجد اقتراحات متاحة
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full p-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {suggestion.is_recent && (
                        <Badge variant="secondary" className="text-xs">
                          جديد
                        </Badge>
                      )}
                      {suggestion.category && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getCategoryIcon(suggestion.category)}
                          {suggestion.category}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {suggestion.usage_count}x
                      </span>
                    </div>
                    <span className="text-sm text-gray-800 flex-1">
                      {suggestion.comment_text_ar}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {suggestions.length} اقتراح
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 px-2 text-xs"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default CommentSuggestions
