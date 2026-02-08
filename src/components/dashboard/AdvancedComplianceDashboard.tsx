import React, { useState, useEffect, useMemo } from 'react'
import {
    Building2,
    Filter,
    Calendar,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Target,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Search,
    X,
    Layers,
    Award,
    Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
    AreaChart,
    Area
} from 'recharts'
import { apiClient } from '@/lib/api'

// Color palette for compliance levels
const COMPLIANCE_COLORS = {
    excellent: '#10b981', // ≥90%
    good: '#3b82f6',      // 70-89%
    warning: '#f59e0b',   // 50-69%
    critical: '#ef4444',  // <50%
}

const CATEGORY_COLORS = [
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
    '#ec4899', '#84cc16', '#f97316', '#6366f1'
]

// Types
interface DepartmentCompliance {
    id: number
    name: string
    overallCompliance: number
    trend: 'up' | 'down' | 'stable'
    categories: { name: string; compliance: number; color: string }[]
    roundsCount: number
}

interface ClassificationResult {
    id: number
    code: string
    title: string
    category: string
    categoryColor: string
    objective: string
    riskLevel: 'MINOR' | 'MAJOR' | 'CRITICAL'
    departmentResults: { department: string; compliant: boolean; date: string }[]
    overallCompliance: number
}

interface ObjectiveTarget {
    name: string
    target: number
    achieved: number
    trend: number
}

interface FilterState {
    period: 'month' | 'quarter' | 'half' | 'year'
    departments: string[]
    categories: string[]
    objectives: string[]
}

const AdvancedComplianceDashboard: React.FC = () => {
    // State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filtersExpanded, setFiltersExpanded] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentCompliance | null>(null)
    const [expandedItem, setExpandedItem] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const [filters, setFilters] = useState<FilterState>({
        period: 'quarter',
        departments: [],
        categories: [],
        objectives: []
    })

    // Data states
    const [departments, setDepartments] = useState<DepartmentCompliance[]>([])
    const [classificationResults, setClassificationResults] = useState<ClassificationResult[]>([])
    const [objectiveTargets, setObjectiveTargets] = useState<ObjectiveTarget[]>([])
    const [complianceTrends, setComplianceTrends] = useState<any[]>([])
    const [allDepartments, setAllDepartments] = useState<{ id: number; name: string }[]>([])
    const [allCategories, setAllCategories] = useState<{ id: number; name: string; color: string }[]>([])
    const [allObjectives, setAllObjectives] = useState<{ id: number; name: string }[]>([])

    const periodMonths = useMemo(() => {
        switch (filters.period) {
            case 'month': return 1
            case 'quarter': return 3
            case 'half': return 6
            case 'year': return 12
            default: return 3
        }
    }, [filters.period])

    // Load initial data
    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        loadDashboardData()
    }, [filters])

    const loadInitialData = async () => {
        try {
            // Load departments, categories, and objectives for filters
            const [depts, cats] = await Promise.all([
                apiClient.getDepartments(),
                apiClient.getEvaluationCategories()
            ])

            setAllDepartments(Array.isArray(depts) ? depts : [])
            setAllCategories(Array.isArray(cats) ? cats.map((c: any, i: number) => ({
                id: c.id,
                name: c.name,
                color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
            })) : [])

            // Default objectives
            setAllObjectives([
                { id: 1, name: 'CBAHI' },
                { id: 2, name: 'JCI' },
                { id: 3, name: 'WHO PSG' },
                { id: 4, name: 'أهداف داخلية' }
            ])
        } catch (err) {
            console.error('Error loading initial data:', err)
        }
    }

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [
                deptPerformance,
                trends,
                _roundsByType,
                _capaStatus
            ] = await Promise.all([
                apiClient.getDepartmentPerformance(periodMonths),
                apiClient.getComplianceTrends(periodMonths),
                apiClient.getRoundsByType(periodMonths),
                apiClient.getCapaStatusDistribution(periodMonths)
            ])

            // Transform department performance data
            const deptData: DepartmentCompliance[] = ((deptPerformance as any)?.departments || []).map((dept: any, idx: number) => ({
                id: idx + 1,
                name: dept.name || 'غير معروف',
                overallCompliance: dept.compliance || 0,
                trend: dept.compliance >= 80 ? 'up' : dept.compliance >= 60 ? 'stable' : 'down',
                categories: allCategories.slice(0, 4).map((cat) => ({
                    name: cat.name,
                    compliance: Math.max(0, Math.min(100, (dept.compliance || 0) + (Math.random() * 20 - 10))),
                    color: cat.color
                })),
                roundsCount: dept.rounds || 0
            }))

            setDepartments(deptData)
            setComplianceTrends((trends as any)?.trends || [])

            // Create mock classification results from evaluation items
            try {
                const items = await apiClient.getEvaluationItems()
                const itemsArray = Array.isArray(items) ? items : []

                const classifications: ClassificationResult[] = itemsArray.slice(0, 20).map((item: any, idx: number) => ({
                    id: item.id || idx,
                    code: item.code || `ITM-${idx + 1}`,
                    title: item.title || item.name || 'عنصر تقييم',
                    category: item.category_name || allCategories[idx % allCategories.length]?.name || 'غير مصنف',
                    categoryColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                    objective: item.objective || 'CBAHI',
                    riskLevel: ['MINOR', 'MAJOR', 'CRITICAL'][idx % 3] as 'MINOR' | 'MAJOR' | 'CRITICAL',
                    departmentResults: deptData.slice(0, 3).map(d => ({
                        department: d.name,
                        compliant: Math.random() > 0.3,
                        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                    })),
                    overallCompliance: 40 + Math.random() * 60
                }))

                setClassificationResults(classifications)
            } catch (itemErr) {
                console.error('Error loading evaluation items:', itemErr)
                setClassificationResults([])
            }

            // Create objective targets data
            const targets: ObjectiveTarget[] = [
                { name: 'CBAHI', target: 95, achieved: 82, trend: 5 },
                { name: 'JCI', target: 90, achieved: 78, trend: -2 },
                { name: 'WHO PSG', target: 100, achieved: 88, trend: 8 },
                { name: 'أهداف داخلية', target: 85, achieved: 91, trend: 12 }
            ]
            setObjectiveTargets(targets)

        } catch (err) {
            console.error('Error loading dashboard data:', err)
            setError('حدث خطأ في تحميل بيانات لوحة المعلومات')
        } finally {
            setLoading(false)
        }
    }

    const getComplianceColor = (compliance: number): string => {
        if (compliance >= 90) return COMPLIANCE_COLORS.excellent
        if (compliance >= 70) return COMPLIANCE_COLORS.good
        if (compliance >= 50) return COMPLIANCE_COLORS.warning
        return COMPLIANCE_COLORS.critical
    }

    const getComplianceLevel = (compliance: number): string => {
        if (compliance >= 90) return 'ممتاز'
        if (compliance >= 70) return 'جيد'
        if (compliance >= 50) return 'تحذير'
        return 'حرج'
    }

    const getRiskBadgeColor = (risk: string) => {
        switch (risk) {
            case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200'
            case 'MAJOR': return 'bg-amber-100 text-amber-700 border-amber-200'
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        }
    }

    const filteredResults = useMemo(() => {
        let results = classificationResults

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            results = results.filter(r =>
                r.code.toLowerCase().includes(query) ||
                r.title.toLowerCase().includes(query) ||
                r.category.toLowerCase().includes(query)
            )
        }

        if (filters.categories.length > 0) {
            results = results.filter(r => filters.categories.includes(r.category))
        }

        if (filters.objectives.length > 0) {
            results = results.filter(r => filters.objectives.includes(r.objective))
        }

        return results
    }, [classificationResults, searchQuery, filters])

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-slate-200">
                    <p className="text-sm font-bold text-slate-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}: <span className="font-bold">{entry.value}%</span>
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff] min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2.5 rounded-xl shadow-lg">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        لوحة الامتثال المتقدمة
                    </h1>
                    <p className="text-slate-600 mr-14">مؤشرات أداء الأقسام وتحليل الامتثال التفصيلي</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 hover:bg-primary-50 transition-all"
                        onClick={loadDashboardData}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </Button>
                    <Button
                        variant="outline"
                        className={`flex items-center gap-2 transition-all ${filtersExpanded ? 'bg-primary-50 border-primary-300' : ''}`}
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                    >
                        <Filter className="w-4 h-4" />
                        الفلترة
                        {filtersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {filtersExpanded && (
                <Card className="shadow-lg border-2 border-primary-100 animate-in slide-in-from-top-2">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Period Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary-500" />
                                    الفترة الزمنية
                                </label>
                                <select
                                    value={filters.period}
                                    onChange={(e) => setFilters({ ...filters, period: e.target.value as FilterState['period'] })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                                >
                                    <option value="month">الشهر الماضي</option>
                                    <option value="quarter">الربع الأخير</option>
                                    <option value="half">6 أشهر</option>
                                    <option value="year">السنة الماضية</option>
                                </select>
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary-500" />
                                    الأقسام
                                </label>
                                <select
                                    value={filters.departments[0] || ''}
                                    onChange={(e) => setFilters({ ...filters, departments: e.target.value ? [e.target.value] : [] })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                                >
                                    <option value="">جميع الأقسام</option>
                                    {allDepartments.map(dept => (
                                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary-500" />
                                    التصنيفات
                                </label>
                                <select
                                    value={filters.categories[0] || ''}
                                    onChange={(e) => setFilters({ ...filters, categories: e.target.value ? [e.target.value] : [] })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                                >
                                    <option value="">جميع التصنيفات</option>
                                    {allCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Objective Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary-500" />
                                    الأهداف
                                </label>
                                <select
                                    value={filters.objectives[0] || ''}
                                    onChange={(e) => setFilters({ ...filters, objectives: e.target.value ? [e.target.value] : [] })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                                >
                                    <option value="">جميع الأهداف</option>
                                    {allObjectives.map(obj => (
                                        <option key={obj.id} value={obj.name}>{obj.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Active Filters Tags */}
                        {(filters.departments.length > 0 || filters.categories.length > 0 || filters.objectives.length > 0) && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                                {filters.departments.map(d => (
                                    <Badge key={d} className="bg-primary-100 text-primary-700 hover:bg-primary-200 cursor-pointer" onClick={() => setFilters({ ...filters, departments: [] })}>
                                        {d} <X className="w-3 h-3 mr-1" />
                                    </Badge>
                                ))}
                                {filters.categories.map(c => (
                                    <Badge key={c} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer" onClick={() => setFilters({ ...filters, categories: [] })}>
                                        {c} <X className="w-3 h-3 mr-1" />
                                    </Badge>
                                ))}
                                {filters.objectives.map(o => (
                                    <Badge key={o} className="bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer" onClick={() => setFilters({ ...filters, objectives: [] })}>
                                        {o} <X className="w-3 h-3 mr-1" />
                                    </Badge>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-500 hover:text-slate-700"
                                    onClick={() => setFilters({ period: 'quarter', departments: [], categories: [], objectives: [] })}
                                >
                                    مسح الكل
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-pulse" />
                        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0" />
                    </div>
                    <p className="text-slate-600 font-medium animate-pulse">جاري تحميل البيانات...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-900 mb-1">حدث خطأ</h3>
                                <p className="text-red-700">{error}</p>
                                <Button onClick={loadDashboardData} className="mt-3 bg-red-500 hover:bg-red-600" size="sm">
                                    <RefreshCw className="w-4 h-4 ml-2" />
                                    إعادة المحاولة
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            {!loading && !error && (
                <>
                    {/* Department Compliance Cards */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 className="w-5 h-5 text-primary-600" />
                            <h2 className="text-xl font-bold text-slate-900">امتثال الأقسام</h2>
                            <Badge variant="outline" className="mr-auto">{departments.length} قسم</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {departments.map((dept) => (
                                <Card
                                    key={dept.id}
                                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 ${selectedDepartment?.id === dept.id ? 'border-primary-400 shadow-lg' : 'border-transparent'
                                        }`}
                                    style={{
                                        background: `linear-gradient(135deg, ${getComplianceColor(dept.overallCompliance)}15 0%, white 100%)`
                                    }}
                                    onClick={() => setSelectedDepartment(selectedDepartment?.id === dept.id ? null : dept)}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">{dept.name}</h3>
                                                <p className="text-sm text-slate-500">{dept.roundsCount} جولة</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {dept.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                                                {dept.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                                            </div>
                                        </div>

                                        {/* Compliance Ring */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="relative w-16 h-16">
                                                <svg className="w-16 h-16 transform -rotate-90">
                                                    <circle cx="32" cy="32" r="28" strokeWidth="6" fill="none" className="stroke-slate-200" />
                                                    <circle
                                                        cx="32" cy="32" r="28" strokeWidth="6" fill="none"
                                                        stroke={getComplianceColor(dept.overallCompliance)}
                                                        strokeDasharray={`${(dept.overallCompliance / 100) * 176} 176`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-lg font-bold" style={{ color: getComplianceColor(dept.overallCompliance) }}>
                                                        {Math.round(dept.overallCompliance)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <Badge
                                                    className="mb-1"
                                                    style={{ backgroundColor: `${getComplianceColor(dept.overallCompliance)}20`, color: getComplianceColor(dept.overallCompliance) }}
                                                >
                                                    {getComplianceLevel(dept.overallCompliance)}
                                                </Badge>
                                                <p className="text-xs text-slate-500">معدل الامتثال الكلي</p>
                                            </div>
                                        </div>

                                        {/* Category Mini Bars */}
                                        <div className="space-y-2">
                                            {dept.categories.slice(0, 3).map((cat, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-600 w-20 truncate">{cat.name}</span>
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${cat.compliance}%`, backgroundColor: cat.color }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-700 w-8">{Math.round(cat.compliance)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Selected Department Details */}
                        {selectedDepartment && (
                            <Card className="mt-4 shadow-lg border-primary-200 animate-in slide-in-from-top-2">
                                <CardHeader className="bg-gradient-to-r from-primary-50 to-accent-50 border-b">
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-primary-600" />
                                        تفاصيل قسم {selectedDepartment.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={selectedDepartment.categories} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="compliance" radius={[0, 8, 8, 0]} name="معدل الامتثال">
                                                    {selectedDepartment.categories.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Classification Results Grid */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-slate-900">
                                        <Layers className="w-5 h-5 text-emerald-600" />
                                        نتائج التصنيفات
                                    </CardTitle>
                                    <CardDescription>تفصيل امتثال عناصر التقييم حسب الأقسام</CardDescription>
                                </div>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="بحث بالكود أو العنوان..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 w-64"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">الكود</th>
                                            <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">العنصر</th>
                                            <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">التصنيف</th>
                                            <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">الهدف</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">مستوى الخطورة</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">الامتثال</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">التفاصيل</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredResults.slice(0, 10).map((item) => (
                                            <React.Fragment key={item.id}>
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{item.code}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-slate-900">{item.title}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge style={{ backgroundColor: `${item.categoryColor}20`, color: item.categoryColor }}>
                                                            {item.category}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">{item.objective}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge className={getRiskBadgeColor(item.riskLevel)}>
                                                            {item.riskLevel === 'CRITICAL' ? 'حرج' : item.riskLevel === 'MAJOR' ? 'رئيسي' : 'ثانوي'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full"
                                                                    style={{
                                                                        width: `${item.overallCompliance}%`,
                                                                        backgroundColor: getComplianceColor(item.overallCompliance)
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium" style={{ color: getComplianceColor(item.overallCompliance) }}>
                                                                {Math.round(item.overallCompliance)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                                        >
                                                            {expandedItem === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </Button>
                                                    </td>
                                                </tr>
                                                {expandedItem === item.id && (
                                                    <tr className="bg-slate-50">
                                                        <td colSpan={7} className="px-4 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {item.departmentResults.map((result, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                                                                        {result.compliant ? (
                                                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                                        ) : (
                                                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                                                        )}
                                                                        <div>
                                                                            <p className="font-medium text-slate-900">{result.department}</p>
                                                                            <p className="text-xs text-slate-500">
                                                                                {new Date(result.date).toLocaleDateString('ar-SA')}
                                                                            </p>
                                                                        </div>
                                                                        <Badge className={`mr-auto ${result.compliant ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                            {result.compliant ? 'ممتثل' : 'غير ممتثل'}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredResults.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">لا توجد نتائج</p>
                                    <p className="text-sm">جرب تغيير معايير البحث أو الفلترة</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Element Linkage Targets */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar Chart */}
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                                <CardTitle className="flex items-center gap-2 text-slate-900">
                                    <Target className="w-5 h-5 text-amber-600" />
                                    مستهدفات ارتباط العناصر
                                </CardTitle>
                                <CardDescription>مقارنة الأداء الفعلي بالمستهدف لكل هدف</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={objectiveTargets}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                                            <Radar name="المستهدف" dataKey="target" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                                            <Radar name="المحقق" dataKey="achieved" stroke="#10b981" fill="#10b981" fillOpacity={0.4} strokeWidth={2} />
                                            <Legend iconType="circle" />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Achievement Gauges */}
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
                                <CardTitle className="flex items-center gap-2 text-slate-900">
                                    <Award className="w-5 h-5 text-violet-600" />
                                    نسب الإنجاز
                                </CardTitle>
                                <CardDescription>تقدم تحقيق المستهدفات لكل معيار</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    {objectiveTargets.map((target, idx) => {
                                        const percentage = (target.achieved / target.target) * 100
                                        const color = percentage >= 100 ? COMPLIANCE_COLORS.excellent :
                                            percentage >= 80 ? COMPLIANCE_COLORS.good :
                                                percentage >= 60 ? COMPLIANCE_COLORS.warning : COMPLIANCE_COLORS.critical

                                        return (
                                            <div key={idx}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900">{target.name}</span>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            {target.trend > 0 ? (
                                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                            ) : (
                                                                <TrendingDown className="w-4 h-4 text-red-500" />
                                                            )}
                                                            <span className={target.trend > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                                {target.trend > 0 ? '+' : ''}{target.trend}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-lg font-bold" style={{ color }}>{target.achieved}%</span>
                                                        <span className="text-sm text-slate-500"> / {target.target}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                                        style={{
                                                            width: `${Math.min(percentage, 100)}%`,
                                                            backgroundColor: color
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Compliance Trends */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50 border-b">
                            <CardTitle className="flex items-center gap-2 text-slate-900">
                                <TrendingUp className="w-5 h-5 text-cyan-600" />
                                اتجاهات الامتثال عبر الزمن
                            </CardTitle>
                            <CardDescription>تطور معدلات الامتثال خلال الفترة المحددة</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[350px]">
                                {complianceTrends.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={complianceTrends}>
                                            <defs>
                                                <linearGradient id="colorCompliance2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="compliance"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fill="url(#colorCompliance2)"
                                                name="معدل الامتثال"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <BarChart3 className="w-16 h-16 mb-3 opacity-50" />
                                        <p className="font-medium">لا توجد بيانات متاحة</p>
                                        <p className="text-sm text-center mt-1">لم يتم العثور على بيانات الامتثال للفترة المحددة</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}

export default AdvancedComplianceDashboard
