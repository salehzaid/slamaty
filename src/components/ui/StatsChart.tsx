import React from 'react';
import { Card, CardContent } from './card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsChartProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

const StatsChart: React.FC<StatsChartProps> = ({
  title,
  value,
  previousValue,
  icon,
  color,
  bgColor,
  trend,
  trendValue
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
    if (!previousValue || previousValue === 0) return 0;
    return ((value - previousValue) / previousValue) * 100;
  };

  const percentage = calculatePercentage();

  return (
    <Card className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 ${bgColor} rounded-xl`}>
            {icon}
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(percentage).toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        
        {previousValue && (
          <div className="text-xs text-gray-500">
            مقارنة بالفترة السابقة: {previousValue}
          </div>
        )}
        
        {/* Simple progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${bgColor.replace('bg-', 'bg-').replace('-100', '-500')}`}
              style={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsChart;
