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
import { AlertCircle } from 'lucide-react'

// Local Error Boundary to catch sub-component render errors
class UnifiedErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 border-2 border-red-200 text-red-900 rounded-3xl m-6 shadow-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                        <h2 className="text-2xl font-bold">Render Error Captured</h2>
                    </div>
                    <div className="bg-white/80 p-6 rounded-2xl border border-red-100 overflow-auto max-h-[400px]">
                        <p className="font-mono text-sm font-bold text-red-800 mb-2">{String(this.state.error)}</p>
                        <pre className="text-[10px] leading-relaxed text-slate-500 font-mono">
                            {this.state.error?.stack}
                        </pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const UnifiedEvaluationPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabParam = searchParams.get('tab')
    const [activeTab, setActiveTab] = useState<string>(tabParam || 'dashboard')

    useEffect(() => {
        if (tabParam && tabParam !== activeTab) {
            setActiveTab(tabParam)
        }
    }, [tabParam])

    const handleTabChange = (tabId: string, action?: string) => {
        setActiveTab(tabId)
        const params: Record<string, string> = { tab: tabId }
        if (action) params.action = action
        setSearchParams(params)
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
        <div className="bg-slate-50/50 p-4 md:p-6 space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">نظام إدارة التقييمات</h1>
                        <p className="text-slate-500">إدارة المعايير، التصنيفات، وتحليل النتائج</p>
                    </div>
                    <Button
                        onClick={() => handleTabChange('items', 'new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg border-none h-11 px-6 transition-all transform hover:scale-105"
                    >
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
            <UnifiedErrorBoundary>
                <div className="animate-in fade-in duration-500">
                    {renderContent()}
                </div>
            </UnifiedErrorBoundary>
        </div>
    )
}

export default UnifiedEvaluationPage
