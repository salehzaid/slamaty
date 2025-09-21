import React, { useState, useMemo } from 'react'
import { 
  Network, 
  BarChart3, 
  Zap, 
  Target, 
  Link, 
  Plus, 
  Settings, 
  Eye, 
  Edit3,
  Trash2,
  Star,
  TrendingUp,
  Users,
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

interface RelationshipNode {
  id: string
  type: 'category' | 'item'
  label: string
  color: string
  size: number
  x?: number
  y?: number
}

interface RelationshipLink {
  source: string
  target: string
  strength: number
  type: 'belongs_to' | 'related_to'
}

const UnifiedEvaluationDashboard: React.FC = () => {
  const { categories, items, addItem, addCategory } = useEvaluation()
  const [activeView, setActiveView] = useState<'overview' | 'builder' | 'analytics' | 'relationships'>('overview')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

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

  // إنشاء بيانات الشبكة للعلاقات
  const networkData = useMemo(() => {
    const nodes: RelationshipNode[] = []
    const links: RelationshipLink[] = []

    // إضافة التصنيفات كعقد
    categories.forEach(category => {
      const itemCount = items.filter(item => item.categoryId === category.id).length
      nodes.push({
        id: `category-${category.id}`,
        type: 'category',
        label: category.name,
        color: category.color,
        size: Math.max(20, itemCount * 3)
      })
    })

    // إضافة العناصر كعقد
    items.forEach(item => {
      nodes.push({
        id: `item-${item.id}`,
        type: 'item',
        label: item.title,
        color: item.categoryColor,
        size: Math.max(10, item.weight * 2)
      })

      // إضافة الروابط
      links.push({
        source: `category-${item.categoryId}`,
        target: `item-${item.id}`,
        strength: item.weight,
        type: 'belongs_to'
      })
    })

    return { nodes, links }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي التصنيفات</p>
                <p className="text-2xl font-bold">{quickStats.totalCategories}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">إجمالي العناصر</p>
                <p className="text-2xl font-bold">{quickStats.totalItems}</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">معدل الإكمال</p>
                <p className="text-2xl font-bold">{quickStats.completionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">متوسط الوزن</p>
                <p className="text-2xl font-bold">{quickStats.averageWeight.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التصنيفات مع العناصر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map(category => {
          const categoryItems = items.filter(item => item.categoryId === category.id)
          return (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
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
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{item.title}</span>
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
                    <p className="text-sm text-gray-500 text-center">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            منشئ التقييمات الذكي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">إضافة سريعة</h3>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                إضافة تصنيف جديد
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">الاقتراحات الذكية</h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">اقتراح ذكي</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    يمكنك إضافة عنصر "فحص نظافة الأدوات" لتصنيف النظافة والتعقيم
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">تحسين مقترح</span>
                  </div>
                  <p className="text-xs text-gray-600">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            التحليلات والإحصائيات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">توزيع العناصر</h3>
              <div className="space-y-3">
                {categories.map(category => {
                  const categoryItems = items.filter(item => item.categoryId === category.id)
                  const percentage = items.length > 0 ? (categoryItems.length / items.length) * 100 : 0
                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{category.name}</span>
                        <span>{categoryItems.length} عنصر</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
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
              <h3 className="text-lg font-semibold mb-4">نظرة عامة</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>إجمالي التصنيفات</span>
                  <Badge variant="outline">{quickStats.totalCategories}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>إجمالي العناصر</span>
                  <Badge variant="outline">{quickStats.totalItems}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>العناصر النشطة</span>
                  <Badge variant="outline">{quickStats.activeItems}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>متوسط الوزن</span>
                  <Badge variant="outline">{quickStats.averageWeight.toFixed(1)}</Badge>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            خريطة العلاقات التفاعلية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">خريطة العلاقات</h3>
              <p className="text-gray-500 mb-4">
                عرض تفاعلي للعلاقات بين التصنيفات والعناصر
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {categories.map(category => {
                  const categoryItems = items.filter(item => item.categoryId === category.id)
                  return (
                    <div key={category.id} className="p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full bg-${category.color}-500`}></div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{categoryItems.length} عنصر مرتبط</p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            لوحة التقييمات الموحدة
          </h1>
          <p className="text-gray-600">إدارة شاملة للتصنيفات والعناصر والعلاقات</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveView('overview')}
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            نظرة عامة
          </Button>
          <Button
            variant={activeView === 'builder' ? 'default' : 'outline'}
            onClick={() => setActiveView('builder')}
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            المنشئ
          </Button>
          <Button
            variant={activeView === 'analytics' ? 'default' : 'outline'}
            onClick={() => setActiveView('analytics')}
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            التحليلات
          </Button>
          <Button
            variant={activeView === 'relationships' ? 'default' : 'outline'}
            onClick={() => setActiveView('relationships')}
            size="sm"
          >
            <Network className="w-4 h-4 mr-2" />
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
  )
}

export default UnifiedEvaluationDashboard
