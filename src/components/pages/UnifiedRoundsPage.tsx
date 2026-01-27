import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Layout, 
  User,
  Plus
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Import the sub-components
import RoundsManagement from './RoundsManagement'
import RoundsListView from './RoundsListView'
import RoundsCalendarView from './RoundsCalendarView'
import MyRoundsPage from './MyRoundsPage'

const UnifiedRoundsPage: React.FC = () => {
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
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">نظام إدارة الجولات</h1>
            <p className="text-slate-500">إدارة وشاملة لجميع جولات الجودة والتقويم والمهام</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg border-none h-11 px-6">
            <Plus className="w-4 h-4 ml-2" />
            إنشاء جولة جديدة
          </Button>
        </div>

        <div className="flex items-center space-x-1 space-x-reverse bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-500">
        {renderContent()}
      </div>
    </div>
  )
}

export default UnifiedRoundsPage
