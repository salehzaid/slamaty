import React, { useState, useMemo } from 'react'
import {
  Network,
  BarChart3,
  Zap,
  Target,
  Plus,
  Eye,
  Star,
  TrendingUp,
  Award,
  Lightbulb
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEvaluation } from '../context/EvaluationContext'
import { cn } from '@/lib/utils'

interface QuickStats {
  totalCategories: number
  totalItems: number
  activeItems: number
  completionRate: number
  averageWeight: number
}

const UnifiedEvaluationDashboard: React.FC = () => {
  const { categories, items } = useEvaluation()
  const [activeView, setActiveView] = useState<'overview' | 'builder' | 'analytics' | 'relationships'>('overview')

  // حساب الإحصائيات السريعة
  const quickStats: QuickStats = useMemo(() => {
    const activeItems = items.filter(item => item.isActive).length
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)

    return {
      totalCategories: categories.length,
      totalItems: items.length,
      activeItems,
      completionRate: items.length > 0 ? (activeItems / items.length) * 100 : 0,
      averageWeight: items.length > 0 ? totalWeight / items.length : 0
    }
  }, [categories, items])

  const getColorClasses = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200'
    }
    return colors[color as keyof typeof colors] || 'bg-slate-100 text-slate-800 border-slate-200'
  }

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'إجمالي التصنيفات', value: quickStats.totalCategories, icon: Target, color: 'blue' },
          { label: 'إجمالي العناصر', value: quickStats.totalItems, icon: BarChart3, color: 'purple' },
          { label: 'العناصر النشطة', value: quickStats.activeItems, icon: Zap, color: 'green' },
          { label: 'نسبة التغطية', value: `${quickStats.completionRate.toFixed(1)}%`, icon: Award, color: 'orange' },
          { label: 'متوسط الوزن', value: quickStats.averageWeight.toFixed(1), icon: Star, color: 'cyan' }
        ].map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={cn(
                  "p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110",
                  getColorClasses(stat.color)
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {categories.map(category => (
          <Card key={category.id} className="border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden bg-white group">
            <CardHeader className={cn(
              "flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100 transition-colors duration-300",
              `bg-${category.color}-50/30 group-hover:bg-${category.color}-50/50`
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                  getColorClasses(category.color)
                )}>
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">{category.name}</CardTitle>
                  <p className="text-xs text-slate-500 font-medium">إجمالي العناصر: {items.filter(i => i.categoryId === category.id).length}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn("px-3 py-1 font-semibold", getColorClasses(category.color))}>
                وزن: {category.weight}%
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {items.filter(i => i.categoryId === category.id).slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-sm transition-all duration-200 group/item">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", `bg-${category.color}-500 shadow-sm`)} />
                      <span className="text-sm font-semibold text-slate-700 group-hover/item:text-slate-900">{item.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold text-slate-500 group-hover/item:text-blue-600 transition-colors">
                      {item.weight} نقطة
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-bold group/btn">
                <span>عرض الكل</span>
                <Plus className="w-4 h-4 mr-2 transition-transform group-hover/btn:rotate-90" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderBuilder = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Plus className="w-5 h-5 text-blue-600" />
              أداة بناء التقييمات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 group hover:border-blue-300 hover:bg-blue-50/20 transition-all duration-300">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-10 h-10 text-slate-300 group-hover:text-blue-400" />
              </div>
              <p className="text-slate-500 font-bold text-lg">اسحب العناصر هنا لبناء نموذج التقييم</p>
              <p className="text-sm text-slate-400 mt-2">أو قم بإضافة تصنيف جديد للبدء</p>
              <Button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-xl shadow-md">
                إضافة تصنيف جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              اقتراحات ذكية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[
              { text: 'إضافة قسم خاص بسلامة الأدوية', color: 'blue' },
              { text: 'تحديث معايير مكافحة العدوى', color: 'purple' },
              { text: 'دمج تقييم البيئة مع الجولات', color: 'green' }
            ].map((sug, i) => (
              <div key={i} className={cn(
                "p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                `bg-${sug.color}-50 border-${sug.color}-100 hover:bg-${sug.color}-100`
              )}>
                <p className={cn("text-sm font-bold flex items-center gap-2", `text-${sug.color}-700`)}>
                  <Plus className="w-4 h-4" />
                  {sug.text}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            تحليل الأوزان النسبية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {categories.map(cat => (
            <div key={cat.id} className="space-y-3 group">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{cat.name}</span>
                <span className="text-sm font-bold text-blue-600">{cat.weight}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 flex items-center justify-end px-1", `bg-${cat.color}-500`)}
                  style={{ width: `${cat.weight}%` }}
                >
                  <div className="w-1 h-1 bg-white/50 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            توزيع عناصر التقييم
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 flex items-center justify-center relative group">
            <div className="absolute inset-0 rounded-full border-[16px] border-blue-500 border-t-transparent border-l-transparent rotate-45 group-hover:rotate-90 transition-transform duration-1000" />
            <div className="text-center space-y-1">
              <span className="text-4xl font-black text-slate-900">{items.length}</span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">إجمالي العناصر</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-12">
            {[
              { label: 'نشطة', count: quickStats.activeItems, color: 'green' },
              { label: 'غير نشطة', count: items.length - quickStats.activeItems, color: 'red' }
            ].map((st, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-200">
                <span className="text-sm font-bold text-slate-600">{st.label}</span>
                <span className={cn("text-lg font-black", `text-${st.color}-600`)}>{st.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderRelationships = () => (
    <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <Network className="w-5 h-5 text-purple-600" />
          شبكة علاقات التقييم
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-8">
          <div className="relative">
            <div className="w-32 h-32 bg-purple-50 rounded-full mx-auto flex items-center justify-center relative z-10">
              <Network className="w-16 h-16 text-purple-200" />
            </div>
            <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping scale-75 opacity-50" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-slate-900">تصور تفاعلي للبيانات</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              هذا القسم سيوفر تصوراً ثلاثي الأبعاد للعلاقة بين التصنيفات وعناصر التقييم وأوزانها النسبية في جولات السلامة.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-8 rounded-xl shadow-md">
              تفعيل العرض ثلاثي الأبعاد
            </Button>
            <Button variant="outline" className="border-slate-200 font-bold h-11 px-8 rounded-xl">
              المزيد من التفاصيل
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] p-0 space-y-0">
      {/* Dynamic Header Background */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-br from-[#f0f4ff] via-[#f8fafc] to-[#f5f3ff] z-0" />

      <div className="relative z-10 space-y-8 p-8 max-w-[1600px] mx-auto">
        {/* Modern Header Section */}
        <Card className="border-none shadow-xl shadow-blue-500/5 bg-white/80 backdrop-blur-xl overflow-hidden rounded-3xl">
          <CardContent className="p-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30 transform transition-transform hover:scale-105 duration-300">
                  <Target className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">نظام التقييم الموحد</h1>
                  <p className="text-slate-500 font-bold text-lg max-w-xl">
                    إدارة وتحليل معايير التقييم لجولات السلامة والجودة بمنظور عصري وتفاعلي
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/50">
                {[
                  { id: 'overview', label: 'نظرة عامة', icon: Eye },
                  { id: 'builder', label: 'المنشئ الذكي', icon: Plus },
                  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
                  { id: 'relationships', label: 'شبكة العلاقات', icon: Network }
                ].map((view) => (
                  <Button
                    key={view.id}
                    onClick={() => setActiveView(view.id as any)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-300",
                      activeView === view.id
                        ? "bg-white text-blue-600 shadow-lg shadow-blue-500/10 scale-105"
                        : "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    <view.icon className={cn("w-5 h-5", activeView === view.id ? "text-blue-600" : "text-slate-400")} />
                    {view.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Content Area */}
        <div className="min-h-[600px]">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'builder' && renderBuilder()}
          {activeView === 'analytics' && renderAnalytics()}
          {activeView === 'relationships' && renderRelationships()}
        </div>
      </div>
    </div>
  )
}

export default UnifiedEvaluationDashboard
