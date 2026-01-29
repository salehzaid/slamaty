import React from 'react';
import { Card, CardContent } from './card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsChartProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  isPercentage?: boolean; // If true, show as percentage with progress bar
  maxValue?: number; // For calculating progress bar when not percentage
}

const StatsChart: React.FC<StatsChartProps> = ({
  title,
  value,
  previousValue,
  icon,
  color,
  bgColor,
  trend,
  isPercentage = false,
  maxValue,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculatePercentage = () => {
    if (previousValue === undefined || previousValue === null || previousValue === 0) return 0;
    return ((value - previousValue) / previousValue) * 100;
  };

  const percentage = calculatePercentage();
  // If trend not explicitly provided, infer from previousValue
  const inferredTrend: 'up' | 'down' | 'stable' | undefined = (() => {
    if (previousValue === undefined || previousValue === null) return undefined
    if (value > previousValue) return 'up'
    if (value < previousValue) return 'down'
    return 'stable'
  })()
  const effectiveTrend = trend || inferredTrend

  // Calculate progress bar percentage
  const progressPercent = isPercentage
    ? Math.min(value, 100)
    : maxValue
      ? Math.min((value / maxValue) * 100, 100)
      : 0;

  return (
    <Card className="relative overflow-hidden bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-slate-200/40 rounded-[2rem] group transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98]">
      <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 transition-opacity group-hover:opacity-40", bgColor.includes('bg-') ? bgColor.replace('-100', '-500') : bgColor)} />

      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl shadow-sm", bgColor)}>
            {React.cloneElement(icon as React.ReactElement, { className: cn((icon as React.ReactElement).props.className, color) })}
          </div>
          {(effectiveTrend && previousValue !== undefined) && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${getTrendColor()} ${getTrendColor().replace('text-', 'bg-').replace('600', '50')}`}
              role="img"
              aria-label={effectiveTrend === 'up' ? 'اتجاه تصاعدي' : effectiveTrend === 'down' ? 'اتجاه هبوطي' : 'مستقر'}
            >
              {getTrendIcon()}
              <span>{Math.abs(percentage).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="mb-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
          <p className={cn("text-3xl font-black tracking-tight", color)}>
            {value}{isPercentage ? '%' : ''}
          </p>
        </div>

        {/* Only show progress bar for percentages or when maxValue is provided */}
        {(isPercentage || maxValue) && (
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-1000 ease-out", bgColor.includes('bg-') ? bgColor.replace('-50', '-500').replace('-100', '-500') : bgColor)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {previousValue !== undefined && (
          <p className="text-[10px] text-slate-400 font-medium mt-2">
            مقارنة بـ <span className="font-bold text-slate-600">{previousValue}</span> سابقاً
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsChart;

