import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRounds } from '@/hooks/useRounds'
import CompleteRoundForm from '@/components/forms/CompleteRoundForm'
import TimelineCalendar from '@/components/ui/TimelineCalendar'
import { apiClient } from '@/lib/api'
import { 
  Plus, 
  Calendar as CalendarIcon, 
  BarChart3, 
  AlertTriangle,
  Target,
  Clock,
  CheckCircle2,
  PlayCircle,
  AlertCircle
} from 'lucide-react'

const RoundsCalendarView: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const { data: rounds, loading, error, refetch } = useRounds()

  // Handle create round
  const handleCreateRound = () => {
    setShowCreateForm(true)
  }

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    try {
      console.log('Creating round:', data)
      
      // Prepare data for backend
      const roundData = {
        title: data.title,
        description: data.description,
        round_type: data.round_type,
        department: data.department || 'عام',
        assigned_to: data.assigned_to || data.assigned_users,
        scheduled_date: data.scheduled_date,
        priority: data.priority,
        notes: data.notes,
        evaluation_items: data.evaluation_items || data.selected_items,
        round_code: data.round_code
      }
      
      // Call API to create round
      await apiClient.createRound(roundData)
      
      console.log('Round created successfully')
      setShowCreateForm(false)
      refetch()
    } catch (error) {
      console.error('Error creating round:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('حدث خطأ في إنشاء الجولة: ' + errorMessage)
    }
  }

  // Handle form cancel
  const handleFormCancel = () => {
    setShowCreateForm(false)
  }

  // Calculate round period based on deadline
  const calculateRoundPeriod = (scheduledDate: Date, deadline?: Date) => {
    if (!deadline) {
      // If no deadline, use scheduled date as start and add 1 day as end
      return {
        start: scheduledDate,
        end: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }
    
    // Calculate period from scheduled date to deadline
    return {
      start: scheduledDate,
      end: deadline
    };
  };

  // Generate colors for different departments
  const departmentColors = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Orange
    '#10B981', // Green
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  // Convert rounds to timeline events with period calculation
  const timelineEvents = useMemo(() => {
    if (!Array.isArray(rounds)) return [];

    return rounds.map((round: any, index: number) => {
      const scheduledDate = new Date(round.scheduled_date || new Date());
      const deadline = round.deadline ? new Date(round.deadline) : undefined;
      const period = calculateRoundPeriod(scheduledDate, deadline);
      
      // Parse assigned users
      let assignedTo: string[] = [];
      if (round.assigned_to) {
        try {
          assignedTo = JSON.parse(round.assigned_to);
        } catch {
          assignedTo = [round.assigned_to];
        }
      }

      // Assign color based on department
      const colorIndex = index % departmentColors.length;
      const color = departmentColors[colorIndex];

      return {
        id: round.id.toString(),
        title: round.title || 'جولة بدون عنوان',
        startDate: period.start,
        endDate: period.end,
        status: round.status as 'scheduled' | 'in_progress' | 'completed' | 'overdue',
        priority: round.priority as 'low' | 'medium' | 'high' | 'urgent',
        department: round.department || 'غير محدد',
        assignedTo: assignedTo,
        color: color
      };
    });
  }, [rounds]);

  // Convert rounds to calendar events (for backward compatibility)
  const calendarEvents = Array.isArray(rounds) ? rounds.map((round: any) => ({
    id: round.id,
    title: round.title || 'جولة بدون عنوان',
    date: new Date(round.scheduled_date || new Date()),
    status: round.status as 'scheduled' | 'in_progress' | 'completed' | 'overdue',
    priority: round.priority as 'low' | 'medium' | 'high' | 'urgent',
    department: round.department || 'غير محدد',
    assignedTo: round.assigned_to ? (() => {
      try {
        return JSON.parse(round.assigned_to)
      } catch {
        return [round.assigned_to]
      }
    })() : []
  })) : []

  // Handle calendar event click
  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event)
    // You can add navigation or modal here
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date)
    // You can add date-specific filtering or navigation here
  }

  // Show create form
  if (showCreateForm) {
    return <CompleteRoundForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">جاري تحميل التقويم</h3>
          <p className="text-lg text-gray-600">يرجى الانتظار...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">خطأ في تحميل التقويم</h3>
          <p className="text-lg text-gray-600 mb-8">{error}</p>
          <Button 
            onClick={refetch} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">تقويم الجولات</h1>
                <p className="text-lg text-gray-600">عرض الجولات في شكل تقويم شهري مع الجدول الزمني</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleCreateRound}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-3 px-8 py-3 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-6 h-6" />
                إنشاء جولة جديدة
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">إجمالي الجولات</p>
                  <p className="text-3xl font-bold">{timelineEvents.length}</p>
                </div>
                <Target className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">مكتملة</p>
                  <p className="text-3xl font-bold">
                    {timelineEvents.filter((r: any) => r.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">قيد التنفيذ</p>
                  <p className="text-3xl font-bold">
                    {timelineEvents.filter((r: any) => r.status === 'in_progress').length}
                  </p>
                </div>
                <PlayCircle className="w-12 h-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">متأخرة</p>
                  <p className="text-3xl font-bold">
                    {timelineEvents.filter((r: any) => r.status === 'overdue').length}
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Calendar View */}
        <TimelineCalendar 
          events={timelineEvents}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onCreateEvent={handleCreateRound}
        />

        {/* Legend */}
        <Card className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">مفتاح الألوان والرموز</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-900">مجدولة</p>
                  <p className="text-sm text-gray-500">جولات مجدولة للمستقبل</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <PlayCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">قيد التنفيذ</p>
                  <p className="text-sm text-gray-500">جولات قيد التنفيذ حالياً</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">مكتملة</p>
                  <p className="text-sm text-gray-500">جولات مكتملة بنجاح</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-gray-900">متأخرة</p>
                  <p className="text-sm text-gray-500">جولات متأخرة عن الموعد</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RoundsCalendarView
