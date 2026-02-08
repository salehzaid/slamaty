import React, { useState, useEffect } from 'react'
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
import EnhancedCapaManagement from '@/components/pages/EnhancedCapaManagement'
import ActionProgressTracker from './ActionProgressTracker'
import CapaTimelineView from './CapaTimelineView'
import AlertSystem from './AlertSystem'
import BasicReports from './BasicReports'

type DashboardView = 'overview' | 'progress' | 'timeline' | 'alerts' | 'reports'

const EnhancedCapaDashboardMain: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview')
  const [selectedCapaId, setSelectedCapaId] = useState<number | undefined>()
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>()
  const [forceE2EManagement, setForceE2EManagement] = useState(false)

  // If E2E_FAILING_ITEMS exists in localStorage, render the management view directly
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('E2E_FAILING_ITEMS')
        if (raw) setForceE2EManagement(true)
      }
    } catch (e) {
      // ignore
    }
  }, [])

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
        return <ActionProgressTracker capaId={selectedCapaId} assignedToId={selectedUserId} />
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
      className="ml-4 px-3 py-1 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600"
    >
      إدارة CAPA
    </button>
  )
}

  if (forceE2EManagement) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <EnhancedCapaManagement />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header + Top Tabs */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-900">
                  داشبورد الخطط التصحيحية
                </h1>
                <p className="text-sm text-slate-600">
                  {getViewDescription(currentView)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
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
                <DashboardCapaCTA />
              </div>
            </div>

            {/* Top navigation (tabs) - no horizontal scroll */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {dashboardViews.map((view) => {
                const Icon = view.icon
                const isActive = currentView === view.id
                return (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id)}
                    className={[
                      "w-full text-right rounded-lg border px-3 py-2 transition-colors",
                      "flex items-start gap-3",
                      isActive
                        ? "bg-primary-50 border-primary-200 text-primary-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Icon className={["w-5 h-5 mt-0.5", isActive ? "text-primary-600" : "text-slate-500"].join(" ")} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium leading-snug">{view.label}</div>
                      <div className="text-xs text-slate-500 leading-snug whitespace-normal">
                        {view.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Filters (when applicable) */}
            {(currentView === 'progress' || currentView === 'timeline' || currentView === 'alerts') && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      خطة محددة
                    </label>
                    <input
                      type="number"
                      placeholder="معرف الخطة"
                      value={selectedCapaId || ''}
                      onChange={(e) => setSelectedCapaId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      مستخدم محدد
                    </label>
                    <input
                      type="number"
                      placeholder="معرف المستخدم"
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderCurrentView()}
      </div>
    </div>
  )
}

export default EnhancedCapaDashboardMain
