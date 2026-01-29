import React, { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    ChevronDown,
    ChevronLeft,
    Check,
    Minus,
    X,
    HelpCircle,
    Filter,
    LayoutList
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EvaluationSidebarProps {
    categories: any[]
    items: any[]
    evaluations: Record<number, string>
    currentItemId: number | null
    onItemSelect: (itemId: number) => void
    onToggleCollapse?: () => void
    isCollapsed?: boolean
}

const EvaluationSidebar: React.FC<EvaluationSidebarProps> = ({
    categories,
    items,
    evaluations,
    currentItemId,
    onItemSelect,
    onToggleCollapse,
    isCollapsed = false
}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({})
    const [filterStatus, setFilterStatus] = useState<string>('all')

    // Initialize all categories as expanded
    React.useEffect(() => {
        const initial: Record<number, boolean> = {}
        categories.forEach(cat => {
            initial[cat.id] = true
        })
        setExpandedCategories(initial)
    }, [categories])

    // Group items by category
    const groupedItems = useMemo(() => {
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

    // Filter items based on search and status
    const filteredGroupedItems = useMemo(() => {
        const filtered: Record<number, any[]> = {}

        Object.entries(groupedItems).forEach(([categoryId, categoryItems]) => {
            const filteredItems = categoryItems.filter(item => {
                // Search filter
                const matchesSearch = searchTerm === '' ||
                    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.code?.toLowerCase().includes(searchTerm.toLowerCase())

                // Status filter
                const status = evaluations[item.id] || 'na'
                const matchesStatus = filterStatus === 'all' ||
                    (filterStatus === 'pending' && status === 'na') ||
                    (filterStatus === 'evaluated' && status !== 'na') ||
                    status === filterStatus

                return matchesSearch && matchesStatus
            })

            if (filteredItems.length > 0) {
                filtered[Number(categoryId)] = filteredItems
            }
        })

        return filtered
    }, [groupedItems, searchTerm, filterStatus, evaluations])

    // Calculate stats
    const stats = useMemo(() => {
        const result = {
            total: items.length,
            applied: 0,
            partial: 0,
            notApplied: 0,
            pending: 0
        }

        items.forEach(item => {
            const status = evaluations[item.id] || 'na'
            if (status === 'applied' || status === 'high_partial') result.applied++
            else if (status === 'partial' || status === 'low_partial') result.partial++
            else if (status === 'not_applied') result.notApplied++
            else result.pending++
        })

        return result
    }, [items, evaluations])

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }))
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'applied':
            case 'high_partial':
                return <Check className="w-3.5 h-3.5 text-green-600" />
            case 'partial':
            case 'low_partial':
                return <Minus className="w-3.5 h-3.5 text-yellow-600" />
            case 'not_applied':
                return <X className="w-3.5 h-3.5 text-red-600" />
            default:
                return <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'applied':
            case 'high_partial':
                return 'border-l-green-500 bg-green-50/50'
            case 'partial':
            case 'low_partial':
                return 'border-l-yellow-500 bg-yellow-50/50'
            case 'not_applied':
                return 'border-l-red-500 bg-red-50/50'
            default:
                return 'border-l-gray-300 bg-gray-50/30'
        }
    }

    const getCategoryColor = (color: string) => {
        const colors: Record<string, string> = {
            yellow: 'bg-yellow-100 border-yellow-400 text-yellow-800',
            orange: 'bg-orange-100 border-orange-400 text-orange-800',
            green: 'bg-green-100 border-green-400 text-green-800',
            blue: 'bg-blue-100 border-blue-400 text-blue-800',
            red: 'bg-red-100 border-red-400 text-red-800',
            purple: 'bg-purple-100 border-purple-400 text-purple-800',
        }
        return colors[color] || 'bg-gray-100 border-gray-400 text-gray-800'
    }

    const getCategoryProgress = (categoryId: number) => {
        const categoryItems = groupedItems[categoryId] || []
        const evaluated = categoryItems.filter(item =>
            evaluations[item.id] && evaluations[item.id] !== 'na'
        ).length
        return { evaluated, total: categoryItems.length }
    }

    if (isCollapsed) {
        return (
            <div className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleCollapse}
                    className="mb-4"
                >
                    <LayoutList className="w-5 h-5" />
                </Button>
                <div className="flex flex-col gap-2">
                    {categories.map(category => {
                        const progress = getCategoryProgress(category.id)
                        const isComplete = progress.evaluated === progress.total
                        return (
                            <div
                                key={category.id}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all",
                                    isComplete
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                                onClick={() => {
                                    const firstItem = groupedItems[category.id]?.[0]
                                    if (firstItem) onItemSelect(firstItem.id)
                                }}
                                title={category.name}
                            >
                                {progress.evaluated}/{progress.total}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-indigo-600" />
                        قائمة البنود
                    </h3>
                    {onToggleCollapse && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleCollapse}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="بحث في البنود..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-9 h-9 text-sm"
                    />
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="all">جميع البنود</option>
                        <option value="pending">لم يُقيّم</option>
                        <option value="evaluated">تم التقييم</option>
                        <option value="applied">مطبق</option>
                        <option value="partial">جزئي</option>
                        <option value="not_applied">غير مطبق</option>
                    </select>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-green-700">{stats.applied}</div>
                        <div className="text-[10px] text-green-600">مطبق</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-yellow-700">{stats.partial}</div>
                        <div className="text-[10px] text-yellow-600">جزئي</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-red-700">{stats.notApplied}</div>
                        <div className="text-[10px] text-red-600">غير مطبق</div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2">
                        <div className="text-lg font-bold text-gray-700">{stats.pending}</div>
                        <div className="text-[10px] text-gray-600">متبقي</div>
                    </div>
                </div>
            </div>

            {/* Categories & Items List */}
            <div className="flex-1 overflow-y-auto">
                {categories.map(category => {
                    const categoryItems = filteredGroupedItems[category.id]
                    if (!categoryItems || categoryItems.length === 0) return null

                    const progress = getCategoryProgress(category.id)
                    const isExpanded = expandedCategories[category.id]

                    return (
                        <div key={category.id} className="border-b border-gray-100">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className={cn(
                                    "w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors",
                                    getCategoryColor(category.color)
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <ChevronDown
                                        className={cn(
                                            "w-4 h-4 transition-transform",
                                            !isExpanded && "-rotate-90"
                                        )}
                                    />
                                    <span className="text-sm font-semibold">{category.name}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    {progress.evaluated}/{progress.total}
                                </Badge>
                            </button>

                            {/* Items */}
                            {isExpanded && (
                                <div className="py-1">
                                    {categoryItems.map((item) => {
                                        const status = evaluations[item.id] || 'na'
                                        const isActive = item.id === currentItemId
                                        const globalIndex = items.findIndex(i => i.id === item.id) + 1

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onItemSelect(item.id)}
                                                className={cn(
                                                    "w-full px-4 py-2.5 flex items-center gap-3 text-right transition-all border-r-4",
                                                    getStatusColor(status),
                                                    isActive
                                                        ? "bg-indigo-50 border-r-indigo-500 ring-1 ring-indigo-200"
                                                        : "hover:bg-gray-50"
                                                )}
                                            >
                                                {/* Status Icon */}
                                                <div className={cn(
                                                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                                                    status === 'applied' || status === 'high_partial' ? 'bg-green-100' :
                                                        status === 'partial' || status === 'low_partial' ? 'bg-yellow-100' :
                                                            status === 'not_applied' ? 'bg-red-100' :
                                                                'bg-gray-100'
                                                )}>
                                                    {getStatusIcon(status)}
                                                </div>

                                                {/* Item Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[10px] font-medium text-gray-400">
                                                            {globalIndex}
                                                        </span>
                                                        {item.code && (
                                                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1 rounded">
                                                                {item.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={cn(
                                                        "text-sm truncate",
                                                        isActive ? "font-semibold text-indigo-900" : "text-gray-700"
                                                    )}>
                                                        {item.title}
                                                    </p>
                                                </div>

                                                {/* Required indicator */}
                                                {item.is_required && (
                                                    <span className="text-red-500 text-xs">⭐</span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">إجمالي البنود</span>
                    <span className="font-bold text-gray-900">{items.length}</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${((stats.total - stats.pending) / stats.total) * 100}%` }}
                    />
                </div>
                <div className="mt-1 text-xs text-gray-500 text-center">
                    {stats.total - stats.pending} من {stats.total} تم تقييمه
                </div>
            </div>
        </div>
    )
}

export default EvaluationSidebar
