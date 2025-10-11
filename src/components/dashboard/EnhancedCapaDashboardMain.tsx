import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Target, 
  Calendar, 
  Bell, 
  FileText,
  Settings,
  TrendingUp,
  Users,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

import EnhancedCapaDashboard from './EnhancedCapaDashboard'
import ActionProgressTracker from './ActionProgressTracker'
import CapaTimelineView from './CapaTimelineView'
import AlertSystem from './AlertSystem'
import BasicReports from './BasicReports'

type DashboardView = 'overview' | 'progress' | 'timeline' | 'alerts' | 'reports'

const EnhancedCapaDashboardMain: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview')
  const [selectedCapaId, setSelectedCapaId] = useState<number | undefined>()
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>()

  const dashboardViews = [
    {
      id: 'overview' as DashboardView,
      label: 'نظرة عامة',
      icon: BarChart3,
      description: 'إحصائيات شاملة ومؤشرات الأداء'
    },
    {
      id: 'progress' as DashboardView,
      label: 'تتبع التقدم',
      icon: Target,
      description: 'متابعة حالة الإجراءات التصحيحية والوقائية'
    },
    {
      id: 'timeline' as DashboardView,
      label: 'الجدول الزمني',
      icon: Calendar,
      description: 'عرض تطور الأحداث والإجراءات عبر الوقت'
    },
    {
      id: 'alerts' as DashboardView,
      label: 'التنبيهات',
      icon: Bell,
      description: 'إدارة التنبيهات والإشعارات المهمة'
    },
    {
      id: 'reports' as DashboardView,
      label: 'التقارير',
      icon: FileText,
      description: 'تقارير مفصلة وتحليلات الأداء'
    }
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return <EnhancedCapaDashboard />
      case 'progress':
        return (
          <ActionProgressTracker 
            capaId={selectedCapaId}
            assignedToId={selectedUserId}
          />
        )
      case 'timeline':
        return <CapaTimelineView capaId={selectedCapaId} />
      case 'alerts':
        return <AlertSystem userId={selectedUserId} />
      case 'reports':
        return <BasicReports />
      default:
        return <EnhancedCapaDashboard />
    }
  }

  const getViewIcon = (viewId: DashboardView) => {
    const view = dashboardViews.find(v => v.id === viewId)
    return view ? view.icon : BarChart3
  }

  const getViewDescription = (viewId: DashboardView) => {
    const view = dashboardViews.find(v => v.id === viewId)
    return view ? view.description : ''
  }

const DashboardCapaCTA: React.FC = () => {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/capa')}
      className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
    >
      إدارة CAPA
    </button>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-lg border-l border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              داشبورد الخطط التصحيحية
            </h2>
            
            <nav className="space-y-2">
              {dashboardViews.map((view) => {
                const Icon = view.icon
                const isActive = currentView === view.id
                
                return (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">{view.label}</div>
                      <div className="text-xs text-gray-500">{view.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">إحصائيات سريعة</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">إجمالي الخطط</span>
                <Badge variant="outline">-</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">متأخرة</span>
                <Badge className="bg-red-100 text-red-800">-</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">مكتملة</span>
                <Badge className="bg-green-100 text-green-800">-</Badge>
              </div>
            </div>
          </div>

          {/* Filters */}
          {(currentView === 'progress' || currentView === 'timeline') && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">فلاتر</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    خطة محددة
                  </label>
                  <input
                    type="number"
                    placeholder="معرف الخطة"
                    value={selectedCapaId || ''}
                    onChange={(e) => setSelectedCapaId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    مستخدم محدد
                  </label>
                  <input
                    type="number"
                    placeholder="معرف المستخدم"
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {React.createElement(getViewIcon(currentView), {
                    className: "w-6 h-6 text-blue-600"
                  })}
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {dashboardViews.find(v => v.id === currentView)?.label}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {getViewDescription(currentView)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedCapaId && (
                    <Badge variant="outline" className="text-xs">
                      خطة #{selectedCapaId}
                    </Badge>
                  )}
                  {selectedUserId && (
                    <Badge variant="outline" className="text-xs">
                      مستخدم #{selectedUserId}
                    </Badge>
                  )}
                  {/* CTA: Open full CAPA management page */}
                  <DashboardCapaCTA />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderCurrentView()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedCapaDashboardMain
