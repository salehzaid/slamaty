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
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-3 ml-4">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

export default PageWrapper
