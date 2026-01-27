import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Target,
    Folder,
    FileText,
    Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Import sub-components
import UnifiedEvaluationDashboard from '../UnifiedEvaluationDashboard'
import EvaluationCategoriesPage from './EvaluationCategoriesPage'
import EvaluationItemsPage from './EvaluationItemsPage'

const UnifiedEvaluationPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabParam = searchParams.get('tab')
    const [activeTab, setActiveTab] = useState<string>(tabParam || 'dashboard')

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
        { id: 'dashboard', label: 'لوحة التقييمات', icon: Target },
        { id: 'categories', label: 'تصنيفات التقييم', icon: Folder },
        { id: 'items', label: 'عناصر التقييم', icon: FileText },
    ]

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
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">نظام إدارة التقييمات</h1>
                        <p className="text-slate-500">إدارة المعايير، التصنيفات، وتحليل النتائج</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg border-none h-11 px-6">
                        <Plus className="w-4 h-4 ml-2" />
                        إنشاء عنصر تقييم
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

export default UnifiedEvaluationPage
