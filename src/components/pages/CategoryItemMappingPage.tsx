import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import {
    ArrowRightLeft,
    Search,
    Plus,
    Trash2,
    Save,
    Filter,
    CheckCircle2,
    X,
    GripVertical
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

// Types
interface Category {
    id: number
    name: string
    color: string
}

interface EvaluationItem {
    id: number
    title: string
    code: string
    category_name?: string
}

const CategoryItemMappingPage: React.FC = () => {
    // State
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

    const [assignedItems, setAssignedItems] = useState<EvaluationItem[]>([])
    const [availableItems, setAvailableItems] = useState<EvaluationItem[]>([])

    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('all')

    const [checkedAvailable, setCheckedAvailable] = useState<number[]>([])
    const [checkedAssigned, setCheckedAssigned] = useState<number[]>([])

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Fetch initial data
    useEffect(() => {
        fetchCategories()
        fetchAllItems()
    }, [])

    // Fetch assigned items when category changes
    useEffect(() => {
        if (selectedCategoryId) {
            fetchAssignedItems(parseInt(selectedCategoryId))
            setCheckedAssigned([])
            setCheckedAvailable([])
        }
    }, [selectedCategoryId])

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/evaluation-categories')
            if (response.ok) {
                const data = await response.json()
                setCategories(data)
                if (data.length > 0) setSelectedCategoryId(data[0].id.toString())
            }
        } catch (error) {
            console.error('Failed to fetch categories', error)
        }
    }

    const fetchAllItems = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/evaluation-items')
            if (response.ok) {
                const data = await response.json()
                setAvailableItems(data)
            }
        } catch (error) {
            console.error('Failed to fetch items', error)
        }
    }

    const fetchAssignedItems = async (categoryId: number) => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/api/mapping/${categoryId}/items`)
            if (response.ok) {
                const data = await response.json()
                setAssignedItems(data)
            }
        } catch (error) {
            console.error('Failed to fetch assigned items', error)
        } finally {
            setLoading(false)
        }
    }

    // Assign items to current category
    const handleAssign = async () => {
        if (!selectedCategoryId || checkedAvailable.length === 0) return

        setSaving(true)
        try {
            const response = await fetch('http://localhost:8000/api/mapping/bulk-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: parseInt(selectedCategoryId),
                    item_ids: checkedAvailable
                })
            })

            if (response.ok) {
                await fetchAssignedItems(parseInt(selectedCategoryId))
                setCheckedAvailable([])
            }
        } catch (error) {
            console.error('Failed to assign items', error)
        } finally {
            setSaving(false)
        }
    }

    // Removing items from current category
    const handleUnassign = async () => {
        if (!selectedCategoryId || checkedAssigned.length === 0) return

        setSaving(true)
        try {
            const response = await fetch('http://localhost:8000/api/mapping/bulk-unassign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: parseInt(selectedCategoryId),
                    item_ids: checkedAssigned
                })
            })

            if (response.ok) {
                await fetchAssignedItems(parseInt(selectedCategoryId))
                setCheckedAssigned([])
            }
        } catch (error) {
            console.error('Failed to unassign items', error)
        } finally {
            setSaving(false)
        }
    }

    // Handle Drag & Drop Reordering
    const handleDragEnd = async (result: any) => {
        if (!result.destination) return
        if (!selectedCategoryId) return

        const items = Array.from(assignedItems)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        setAssignedItems(items) // Optimistic update

        // Persist order
        const orderedIds = items.map(item => item.id)
        try {
            await fetch('http://localhost:8000/api/mapping/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: parseInt(selectedCategoryId),
                    ordered_item_ids: orderedIds
                })
            })
        } catch (error) {
            console.error('Failed to update order', error)
            fetchAssignedItems(parseInt(selectedCategoryId)) // Revert on fail
        }
    }

    // Filtering Logic
    const filteredAvailableItems = availableItems.filter(item => {
        // 1. Exclude already assigned items
        const isAssigned = assignedItems.some(assigned => assigned.id === item.id)
        if (isAssigned) return false

        // 2. Search filter
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.code.toLowerCase().includes(searchQuery.toLowerCase())
        if (!matchesSearch) return false

        // 3. Category filter (original category of item)
        if (filterCategory !== 'all') {
            // Since we don't have category_id on item exposed simply, we might use category_name if available
            // or we just skip this for now to keep it simple
        }

        return true
    })

    // Toggle Selection Handlers
    const toggleAvailable = (id: number) => {
        setCheckedAvailable(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleAssigned = (id: number) => {
        setCheckedAssigned(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div>
                <h1 className="text-2xl font-bold mb-2">ربط وتصنيف عناصر التقييم</h1>
                <p className="text-muted-foreground">قم بإدارة العناصر المرتبطة بكل تصنيف وترتيبها.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">

                {/* Left Pane: Assigned Items (Droppable) */}
                <Card className="flex flex-col h-full bg-slate-50 border-slate-200">
                    <CardHeader className="bg-white border-b px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold ml-2">التصنيف الحالي:</span>
                                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="اختر تصنيف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleUnassign}
                                disabled={checkedAssigned.length === 0 || saving}
                            >
                                <Trash2 className="w-4 h-4 ml-1" />
                                إزالة المحدد ({checkedAssigned.length})
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex justify-center py-10">جار التحميل...</div>
                        ) : assignedItems.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                لا توجد عناصر مرتبطة بهذا التصنيف
                            </div>
                        ) : (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="assigned-list">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-2"
                                        >
                                            {assignedItems.map((item, index) => (
                                                <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`
                                flex items-center p-3 rounded-lg border bg-white shadow-sm group
                                ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}
                                ${checkedAssigned.includes(item.id) ? 'border-primary bg-blue-50' : 'border-gray-100'}
                              `}
                                                        >
                                                            <div {...provided.dragHandleProps} className="ml-3 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600">
                                                                <GripVertical className="w-5 h-5" />
                                                            </div>
                                                            <Checkbox
                                                                checked={checkedAssigned.includes(item.id)}
                                                                onCheckedChange={() => toggleAssigned(item.id)}
                                                                className="ml-3"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-900">{item.code}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 line-clamp-1">{item.title}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                        <div className="h-10"></div> {/* Spacer */}
                    </CardContent>
                </Card>

                {/* Right Pane: Available Items */}
                <Card className="flex flex-col h-full border-slate-200">
                    <CardHeader className="bg-slate-50 border-b px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="بحث في العناصر..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-9"
                                />
                            </div>
                            <Button
                                onClick={handleAssign}
                                disabled={checkedAvailable.length === 0 || !selectedCategoryId || saving}
                            >
                                <Plus className="w-4 h-4 ml-1" />
                                إضافة ({checkedAvailable.length})
                            </Button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                            <span>العناصر المتاحة: {filteredAvailableItems.length}</span>
                            {checkedAvailable.length > 0 && (
                                <button onClick={() => setCheckedAvailable([])} className="text-primary hover:underline">
                                    إلغاء التحديد
                                </button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                        <div className="space-y-2">
                            {filteredAvailableItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`
                     flex items-center p-3 rounded-lg border bg-white shadow-sm transition-colors cursor-pointer
                     ${checkedAvailable.includes(item.id) ? 'border-primary bg-blue-50' : 'border-gray-100 hover:border-gray-300'}
                   `}
                                    onClick={() => toggleAvailable(item.id)}
                                >
                                    <Checkbox
                                        checked={checkedAvailable.includes(item.id)}
                                        onCheckedChange={() => toggleAvailable(item.id)}
                                        className="ml-3 pointer-events-none" // Handled by parent div
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">{item.code}</span>
                                            {item.category_name && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                    {item.category_name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-0.5">{item.title}</p>
                                    </div>
                                </div>
                            ))}

                            {filteredAvailableItems.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    لا توجد عناصر مطابقة للبحث
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}

export default CategoryItemMappingPage
