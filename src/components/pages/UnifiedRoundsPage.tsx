import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// Import the existing page components
import RoundsListView from './RoundsListView'
import RoundsCalendarView from './RoundsCalendarView'
import MyRoundsPage from './MyRoundsPage'

type TabType = 'list' | 'calendar' | 'my-rounds'

const UnifiedRoundsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()

    // Get active tab from URL query params, default to 'list'
    const activeTabFromUrl = (searchParams.get('tab') as TabType) || 'list'
    const [activeTab, setActiveTab] = useState<TabType>(activeTabFromUrl)

    // Sync active tab with URL
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') as TabType
        if (tabFromUrl && ['list', 'calendar', 'my-rounds'].includes(tabFromUrl)) {
            setActiveTab(tabFromUrl)
        } else {
            // Default to 'list' if no valid tab in URL
            setActiveTab('list')
            setSearchParams({ tab: 'list' }, { replace: true })
        }
    }, [searchParams, setSearchParams])

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab)
        setSearchParams({ tab })
    }

    const tabs = [
        {
            id: 'list' as TabType,
            label: 'عرض الجولات',
            icon: FileText,
            color: 'text-green-600'
        },
        {
            id: 'calendar' as TabType,
            label: 'تقويم الجولات',
            icon: Calendar,
            color: 'text-blue-600'
        },
        {
            id: 'my-rounds' as TabType,
            label: 'جولاتي',
            icon: User,
            color: 'text-purple-600'
        }
    ]

    // Render the appropriate component based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'list':
                return <RoundsListView />
            case 'calendar':
                return <RoundsCalendarView />
            case 'my-rounds':
                return <MyRoundsPage />
            default:
                return <RoundsListView />
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff]">
            <div className="p-6 space-y-6">
                {/* Tab Navigation */}
                <Card className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 backdrop-blur">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 flex-wrap">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id

                                return (
                                    <Button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-6 py-3 h-auto text-base font-semibold rounded-xl transition-all duration-300",
                                            isActive
                                                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700"
                                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                                        )}
                                    >
                                        <Icon className={cn("w-5 h-5", isActive ? "text-white" : tab.color)} />
                                        <span>{tab.label}</span>
                                    </Button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Content Area */}
                <div className="transition-all duration-300">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

export default UnifiedRoundsPage
