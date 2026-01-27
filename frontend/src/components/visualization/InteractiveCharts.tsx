import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Filter,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
    tension?: number
  }>
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter'
  title: string
  description?: string
  data: ChartData
  options: {
    responsive: boolean
    maintainAspectRatio: boolean
    plugins: {
      legend: {
        position: 'top' | 'bottom' | 'left' | 'right'
        display: boolean
      }
      title: {
        display: boolean
        text: string
      }
      tooltip: {
        enabled: boolean
      }
    }
    scales?: {
      x?: {
        display: boolean
        title: {
          display: boolean
          text: string
        }
      }
      y?: {
        display: boolean
        title: {
          display: boolean
          text: string
        }
        beginAtZero?: boolean
      }
    }
    animation?: {
      duration: number
      easing: string
    }
  }
}

interface InteractiveChartsProps {
  charts: ChartConfig[]
  autoRefresh?: boolean
  refreshInterval?: number
  onChartClick?: (chartId: string, data: any) => void
  onDataUpdate?: (chartId: string, newData: ChartData) => void
}

const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  charts,
  autoRefresh = false,
  refreshInterval = 30000,
  onChartClick,
  onDataUpdate
}) => {
  const [activeCharts, setActiveCharts] = useState<Set<string>>(new Set(charts.map(chart => chart.title)))
  const [isFullscreen, setIsFullscreen] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [chartData, setChartData] = useState<Record<string, ChartData>>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)

  const chartRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const animationRef = useRef<number | null>(null)

  // Initialize chart data
  useEffect(() => {
    const initialData: Record<string, ChartData> = {}
    charts.forEach(chart => {
      initialData[chart.title] = chart.data
    })
    setChartData(initialData)
  }, [charts])

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshChartData()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const refreshChartData = async () => {
    try {
      // Simulate data refresh - in real implementation, this would fetch from API
      const updatedData: Record<string, ChartData> = {}
      
      charts.forEach(chart => {
        const currentData = chartData[chart.title] || chart.data
        const newData = {
          ...currentData,
          datasets: currentData.datasets.map(dataset => ({
            ...dataset,
            data: dataset.data.map(value => 
              Math.max(0, value + (Math.random() - 0.5) * value * 0.1)
            )
          }))
        }
        updatedData[chart.title] = newData
      })
      
      setChartData(updatedData)
      
      // Notify parent component
      Object.entries(updatedData).forEach(([chartId, data]) => {
        onDataUpdate?.(chartId, data)
      })
    } catch (error) {
      console.error('Failed to refresh chart data:', error)
    }
  }

  const toggleChart = (chartTitle: string) => {
    setActiveCharts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(chartTitle)) {
        newSet.delete(chartTitle)
      } else {
        newSet.add(chartTitle)
      }
      return newSet
    })
  }

  const toggleFullscreen = (chartTitle: string) => {
    setIsFullscreen(isFullscreen === chartTitle ? null : chartTitle)
  }

  const startAnimation = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setIsPlaying(true)
    setCurrentFrame(0)
    setTotalFrames(100) // 100 frames for smooth animation
    
    const animate = () => {
      setCurrentFrame(prev => {
        if (prev >= totalFrames) {
          setIsAnimating(false)
          setIsPlaying(false)
          return 0
        }
        return prev + 1
      })
      
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  const stopAnimation = () => {
    setIsAnimating(false)
    setIsPlaying(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const resetAnimation = () => {
    stopAnimation()
    setCurrentFrame(0)
  }

  const exportChart = (chartTitle: string) => {
    const canvas = chartRefs.current[chartTitle]
    if (canvas) {
      const link = document.createElement('a')
      link.download = `${chartTitle}-chart.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const getChartIcon = (type: string) => {
    const icons = {
      'bar': BarChart3,
      'line': LineChart,
      'pie': PieChart,
      'doughnut': PieChart,
      'area': TrendingUp,
      'scatter': TrendingUp
    }
    return icons[type as keyof typeof icons] || BarChart3
  }

  const getChartColor = (type: string) => {
    const colors = {
      'bar': 'text-blue-600',
      'line': 'text-green-600',
      'pie': 'text-purple-600',
      'doughnut': 'text-purple-600',
      'area': 'text-orange-600',
      'scatter': 'text-red-600'
    }
    return colors[type as keyof typeof colors] || 'text-gray-600'
  }

  const renderChart = (chart: ChartConfig) => {
    if (!activeCharts.has(chart.title)) {
      return null
    }

    const ChartIcon = getChartIcon(chart.type)
    const chartColor = getChartColor(chart.type)
    const data = chartData[chart.title] || chart.data

    return (
      <Card 
        key={chart.title} 
        className={`transition-all duration-300 ${
          isFullscreen === chart.title ? 'fixed inset-4 z-50' : ''
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartIcon className={`w-5 h-5 ${chartColor}`} />
              <CardTitle>{chart.title}</CardTitle>
              {chart.description && (
                <Badge variant="outline" className="text-xs">
                  {chart.description}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => exportChart(chart.title)}
                className="p-1"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleFullscreen(chart.title)}
                className="p-1"
              >
                {isFullscreen === chart.title ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleChart(chart.title)}
                className="p-1"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className={`relative ${isFullscreen === chart.title ? 'h-[calc(100vh-200px)]' : 'h-64'}`}>
            <canvas
              ref={el => chartRefs.current[chart.title] = el}
              className="w-full h-full"
              style={{
                filter: isAnimating ? `opacity(${0.5 + (currentFrame / totalFrames) * 0.5})` : 'none'
              }}
            />
            
            {/* Chart overlay for interactions */}
            <div className="absolute inset-0 pointer-events-none">
              {isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري التحديث...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chart controls */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isPlaying ? stopAnimation : startAnimation}
                  className="flex items-center gap-1"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  {isPlaying ? 'إيقاف' : 'تشغيل'}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetAnimation}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  إعادة تعيين
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshChartData}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  تحديث
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>النقاط: {data.labels.length}</span>
                <span>المجموعات: {data.datasets.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            الرسوم البيانية التفاعلية
          </h1>
          <p className="text-gray-600">
            رسوم بيانية تفاعلية مع إمكانيات متقدمة
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshChartData}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث الكل
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveCharts(new Set(charts.map(chart => chart.title)))}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            إظهار الكل
          </Button>
        </div>
      </div>

      {/* Chart Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">الرسوم البيانية:</span>
                <Badge variant="outline">
                  {activeCharts.size} من {charts.length}
                </Badge>
              </div>
              
              {isAnimating && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">التقدم:</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentFrame / totalFrames) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{currentFrame}/{totalFrames}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {charts.map(chart => {
                const ChartIcon = getChartIcon(chart.type)
                const chartColor = getChartColor(chart.type)
                
                return (
                  <Button
                    key={chart.title}
                    size="sm"
                    variant={activeCharts.has(chart.title) ? "default" : "outline"}
                    onClick={() => toggleChart(chart.title)}
                    className="flex items-center gap-1"
                  >
                    <ChartIcon className={`w-3 h-3 ${activeCharts.has(chart.title) ? 'text-white' : chartColor}`} />
                    {chart.title}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className={`grid gap-6 ${
        isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
      }`}>
        {charts.map(renderChart)}
      </div>

      {activeCharts.size === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد رسوم بيانية نشطة</p>
          <p className="text-sm text-gray-400 mt-2">اختر الرسوم البيانية التي تريد عرضها</p>
        </div>
      )}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsFullscreen(null)}
        />
      )}
    </div>
  )
}

export default InteractiveCharts
