import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
    progress: number
    size?: number
    strokeWidth?: number
    className?: string
    showLabel?: boolean
    labelClassName?: string
    color?: 'purple' | 'green' | 'blue' | 'red' | 'yellow' | 'gray'
}

const colorMap = {
    purple: 'stroke-purple-500',
    green: 'stroke-emerald-500',
    blue: 'stroke-blue-500',
    red: 'stroke-rose-500',
    yellow: 'stroke-amber-500',
    gray: 'stroke-slate-400'
}

const bgColorMap = {
    purple: 'stroke-purple-100',
    green: 'stroke-emerald-100',
    blue: 'stroke-blue-100',
    red: 'stroke-rose-100',
    yellow: 'stroke-amber-100',
    gray: 'stroke-slate-100'
}

const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 80,
    strokeWidth = 8,
    className,
    showLabel = true,
    labelClassName,
    color = 'purple'
}) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className={bgColorMap[color]}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn(colorMap[color], "transition-all duration-1000 ease-out")}
                />
            </svg>
            {showLabel && (
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    labelClassName
                )}>
                    <span className="text-lg font-black text-slate-900">{Math.round(progress)}%</span>
                </div>
            )}
        </div>
    )
}

export default ProgressRing
