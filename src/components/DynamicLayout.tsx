import React from 'react'
import { cn } from '@/lib/utils'
import { useLayout } from '@/context/LayoutContext'

interface DynamicLayoutProps {
  children: React.ReactNode
  className?: string
}

const DynamicLayout: React.FC<DynamicLayoutProps> = ({ children, className }) => {
  const { headerHeight, sidebarWidth, isMobile } = useLayout()

  return (
    <div 
      className={cn(
        "min-h-screen bg-gray-50 dark:bg-slate-900 transition-all duration-300 ease-in-out",
        "flex-1 overflow-hidden",
        className
      )}
      style={{
        minHeight: `calc(100vh - ${headerHeight}px)`
      }}
    >
      <div className="min-h-full bg-white dark:bg-slate-900 overflow-y-auto h-full">
        {children}
      </div>
    </div>
  )
}

export default DynamicLayout
