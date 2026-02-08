import React from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  showHeader?: boolean
  headerActions?: React.ReactNode
}

const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children, 
  title, 
  description, 
  className,
  showHeader = true,
  headerActions
}) => {
  return (
    <div className={cn("min-h-full", className)}>
      {showHeader && (title || description || headerActions) && (
        <div className="mb-8 pb-6 border-b border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-4 ml-6">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-8">
        {children}
      </div>
    </div>
  )
}

export default PageWrapper
