import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileText,
  Calendar as CalendarIcon,
  Layout,
  User,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// Import the sub-components
import RoundsManagement from './RoundsManagement'
import RoundsListView from './RoundsListView'
import RoundsCalendarView from './RoundsCalendarView'
import MyRoundsPage from './MyRoundsPage'

const UnifiedRoundsPage: React.FC = () => {
  const { hasPermission } = useAuth() as any
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'management')

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const tabs = [
    { id: 'management', label: 'إدارة الجولات', icon: Layout },
    { id: 'list', label: 'عرض الجولات', icon: FileText },
    { id: 'calendar', label: 'تقويم الجولات', icon: CalendarIcon },
    { id: 'my-rounds', label: 'جولاتي', icon: User },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'management':
        return <RoundsManagement />
      case 'list':
        return <RoundsListView />
      case 'calendar':
        return <RoundsCalendarView />
      case 'my-rounds':
        return <MyRoundsPage />
      default:
        return <RoundsManagement />
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8 pb-20">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Layout className="w-3 h-3" />
              منصة الإدارة
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              إدارة <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">الجولات</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
              نظام متكامل لإدارة جولات الجودة، التقويم المستمر، ومتابعة المهام بكفاءة عالية.
            </p>
          </div>

          {hasPermission(['super_admin', 'quality_manager']) && (
            <Button
              onClick={() => setSearchParams({ tab: 'list', create: 'true' })}
              className="group relative bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-slate-200 transition-all active:scale-95 border-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 ml-2 relative z-10" />
              <span className="relative z-10">إنشاء جولة جديدة</span>
            </Button>
          )}
        </div>

        {/* Segmented Control Tabs */}
        <div className="mt-10 flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-[1.25rem] w-fit border border-slate-200/50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                  isActive
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-slate-900 rounded-xl shadow-lg shadow-slate-200" />
                )}
                <Icon className={cn("w-4 h-4 relative z-10", isActive ? "text-white" : "text-slate-400")} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area with smooth transitions */}
      <div className="relative">
        <div className="transition-all duration-500 ease-in-out">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default UnifiedRoundsPage
