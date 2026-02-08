import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Folder, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

// Import the existing page components
import UnifiedEvaluationDashboard from '../UnifiedEvaluationDashboard'
import EvaluationCategoriesPage from './EvaluationCategoriesPage'
import EvaluationItemsPage from './EvaluationItemsPage'

type TabType = 'dashboard' | 'categories' | 'items'

const UnifiedEvaluationPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()

    // Get active tab from URL query params, default to 'dashboard'
    const activeTabFromUrl = (searchParams.get('tab') as TabType) || 'dashboard'
    const [activeTab, setActiveTab] = useState<TabType>(activeTabFromUrl)

    // Sync active tab with URL
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') as TabType
        if (tabFromUrl && ['dashboard', 'categories', 'items'].includes(tabFromUrl)) {
            setActiveTab(tabFromUrl)
        } else {
            // Default to 'dashboard' if no valid tab in URL
            setActiveTab('dashboard')
            setSearchParams({ tab: 'dashboard' }, { replace: true })
        }
    }, [searchParams, setSearchParams])

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab)
        setSearchParams({ tab })
    }

    const tabs = [
        {
            id: 'dashboard' as TabType,
            label: 'لوحة التقييمات',
            icon: BarChart3,
            color: 'text-blue-600'
        },
        {
            id: 'categories' as TabType,
            label: 'تصنيفات التقييم',
            icon: Folder,
            color: 'text-blue-600'
        },
        {
            id: 'items' as TabType,
            label: 'عناصر التقييم',
            icon: FileText,
            color: 'text-green-600'
        }
    ]

    // Render the appropriate component based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <UnifiedEvaluationDashboard />
            case 'categories':
                return <EvaluationCategoriesPage />
            case 'items':
                return <EvaluationItemsPage />
            default:
                return <UnifiedEvaluationDashboard />
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

export default UnifiedEvaluationPage
