import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  current: number
  total: number
  completed?: number[]
  onStepClick?: (step: number) => void
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  completed = [],
  onStepClick,
  className
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  const getStepStatus = (step: number) => {
    if (completed.includes(step)) return 'completed'
    if (step === current) return 'current'
    return 'pending'
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white'
      case 'current':
        return 'bg-blue-500 border-blue-500 text-white'
      default:
        return 'bg-gray-200 border-gray-300 text-gray-600 hover:bg-gray-300'
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">التقدم</span>
          <span className="text-sm font-bold text-blue-600">{current}/{total}</span>
        </div>
        <div className="text-sm font-semibold text-gray-600">
          {percentage}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step Dots */}
      <div className="flex justify-center gap-2 flex-wrap">
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1
          const status = getStepStatus(step)
          const isClickable = onStepClick && (completed.includes(step) || step <= current + 1)
          
          return (
            <button
              key={step}
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-200',
                getStepColor(status),
                isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50'
              )}
              title={`الخطوة ${step} من ${total}`}
            >
              {completed.includes(step) ? '✓' : step}
            </button>
          )
        })}
      </div>

      {/* Progress Stats */}
      <div className="mt-3 text-center text-xs text-gray-500">
        <span>مكتمل: {completed.length}</span>
        <span className="mx-2">•</span>
        <span>متبقي: {total - completed.length}</span>
      </div>
    </div>
  )
}

export default ProgressBar
