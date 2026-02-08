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
    const itemsList = Array.isArray(items) ? items : []
    const activeItems = itemsList.filter(item => item && item.isActive).length
    const totalWeight = itemsList.reduce((sum, item) => sum + (item?.weight || 0), 0)

    return {
      totalCategories: Array.isArray(categories) ? categories.length : 0,
      totalItems: itemsList.length,
      activeItems,
      completionRate: itemsList.length > 0 ? (activeItems / itemsList.length) * 100 : 0,
      averageWeight: itemsList.length > 0 ? totalWeight / itemsList.length : 0
    }
  }, [categories, items])

  const getColorClasses = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">إجمالي التصنيفات</p>
              <p className="text-3xl font-bold text-slate-800">{quickStats.totalCategories}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">إجمالي العناصر</p>
              <p className="text-3xl font-bold text-slate-800">{quickStats.totalItems}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">معدل الإكمال</p>
              <p className="text-3xl font-bold text-purple-600">{quickStats.completionRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">متوسط الوزن</p>
              <p className="text-3xl font-bold text-orange-600">{quickStats.averageWeight.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التصنيفات مع العناصر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map(category => {
          const categoryItems = items.filter(item => item.categoryId === category.id)
          return (
            <Card key={category.id} className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full bg-${category.color}-500`}></div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <Badge className={getColorClasses(category.color)}>
                    {categoryItems.length} عنصر
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <span className="text-sm font-medium text-slate-700">{item.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          وزن: {item.weight}
                        </Badge>
                        {item.isRequired && (
                          <Badge variant="destructive" className="text-xs">مطلوب</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {categoryItems.length > 3 && (
                    <p className="text-sm text-slate-500 text-center pt-2">
                      و {categoryItems.length - 3} عنصر آخر...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderBuilder = () => (
    <div className="space-y-6">
      <Card className="bg-white shadow-md border border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Zap className="w-5 h-5 text-primary-600" />
            منشئ التقييمات الذكي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">إضافة سريعة</h3>
              <Button variant="outline" className="w-full hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-colors">
                <Plus className="w-4 h-4 ml-2" />
                إضافة تصنيف جديد
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">الاقتراحات الذكية</h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">اقتراح ذكي</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    يمكنك إضافة عنصر "فحص نظافة الأدوات" لتصنيف النظافة والتعقيم
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">تحسين مقترح</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    تصنيف "الجودة" يحتاج إلى عناصر أكثر لتحسين التغطية
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card className="bg-white shadow-md border border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            التحليلات والإحصائيات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-800">توزيع العناصر</h3>
              <div className="space-y-3">
                {categories.map(category => {
                  const categoryItems = items.filter(item => item.categoryId === category.id)
                  const percentage = items.length > 0 ? (categoryItems.length / items.length) * 100 : 0
                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex justify-between text-sm text-slate-700">
                        <span>{category.name}</span>
                        <span>{categoryItems.length} عنصر</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-${category.color}-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-800">نظرة عامة</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="text-slate-700">إجمالي التصنيفات</span>
                  <Badge variant="outline" className="text-slate-700">{quickStats.totalCategories}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="text-slate-700">إجمالي العناصر</span>
                  <Badge variant="outline" className="text-slate-700">{quickStats.totalItems}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="text-slate-700">العناصر النشطة</span>
                  <Badge variant="outline" className="text-slate-700">{quickStats.activeItems}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="text-slate-700">متوسط الوزن</span>
                  <Badge variant="outline" className="text-slate-700">{quickStats.averageWeight.toFixed(1)}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderRelationships = () => (
    <div className="space-y-6">
      <Card className="bg-white shadow-md border border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Network className="w-5 h-5 text-primary-600" />
            خريطة العلاقات التفاعلية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 min-h-[400px] flex items-center justify-center border border-slate-200">
            <div className="text-center">
              <Network className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">خريطة العلاقات</h3>
              <p className="text-slate-500 mb-4">
                عرض تفاعلي للعلاقات بين التصنيفات والعناصر
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {categories.map(category => {
                  const categoryItems = items.filter(item => item.categoryId === category.id)
                  return (
                    <div key={category.id} className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full bg-${category.color}-500`}></div>
                        <span className="text-sm font-medium text-slate-800">{category.name}</span>
                      </div>
                      <p className="text-xs text-slate-500">{categoryItems.length} عنصر مرتبط</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff]">
      <div className="p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 p-8 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">لوحة التقييمات</h1>
                <p className="text-lg text-slate-600">إدارة شاملة للتصنيفات والعناصر والعلاقات</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 p-6 backdrop-blur">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant={activeView === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveView('overview')}
              className={activeView === 'overview'
                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300"
              }
            >
              <Eye className="w-5 h-5 ml-2" />
              نظرة عامة
            </Button>
            <Button
              variant={activeView === 'builder' ? 'default' : 'outline'}
              onClick={() => setActiveView('builder')}
              className={activeView === 'builder'
                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300"
              }
            >
              <Zap className="w-5 h-5 ml-2" />
              المنشئ
            </Button>
            <Button
              variant={activeView === 'analytics' ? 'default' : 'outline'}
              onClick={() => setActiveView('analytics')}
              className={activeView === 'analytics'
                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300"
              }
            >
              <BarChart3 className="w-5 h-5 ml-2" />
              التحليلات
            </Button>
            <Button
              variant={activeView === 'relationships' ? 'default' : 'outline'}
              onClick={() => setActiveView('relationships')}
              className={activeView === 'relationships'
                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300"
              }
            >
              <Network className="w-5 h-5 ml-2" />
              العلاقات
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeView === 'overview' && renderOverview()}
        {activeView === 'builder' && renderBuilder()}
        {activeView === 'analytics' && renderAnalytics()}
        {activeView === 'relationships' && renderRelationships()}
      </div>
    </div>
  )
}

export default UnifiedEvaluationDashboard
