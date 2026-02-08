import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRounds } from '@/hooks/useRounds'
import CompleteRoundForm from '@/components/forms/CompleteRoundForm'
import { apiClient } from '@/lib/api'
import {
  Plus,
  Calendar as CalendarIcon,
  AlertTriangle,
  Target,
  CheckCircle2,
  PlayCircle,
  AlertCircle
} from 'lucide-react'

// FullCalendar imports
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import './CalendarStyles.css'

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

  // Calculate round period based on database data: scheduled_date and end_date
  const calculateRoundPeriod = (scheduledDate: Date, endDate?: Date, deadline?: Date) => {
    // Priority 1: Use end_date from database
    if (endDate) {
      return {
        start: scheduledDate,
        end: endDate
      };
    }

    // Priority 2: Fallback to deadline if end_date not available (legacy support)
    if (deadline) {
      return {
        start: scheduledDate,
        end: deadline
      };
    }

    // Priority 3: Default fallback (1 hour duration for strict calendar view, or 1 day)
    // For FullCalendar, if we want it to look like a spanning event, end date is exclusive.
    // If start and end are same day, it's an all-day event or timed event.
    return {
      start: scheduledDate,
      end: new Date(scheduledDate.getTime() + 60 * 60 * 1000) // Default 1 hour
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

  // Convert rounds to FullCalendar events
  const calendarEvents = useMemo(() => {
    if (!Array.isArray(rounds)) return [];

    return rounds.map((round: any, index: number) => {
      const scheduledDate = round.scheduled_date ? new Date(round.scheduled_date) : new Date();
      const endDate = round.end_date ? new Date(round.end_date) : undefined;
      const deadline = round.deadline ? new Date(round.deadline) : undefined;


      const period = calculateRoundPeriod(scheduledDate, endDate, deadline);

      // Color logic
      const colorIndex = index % departmentColors.length;
      const color = departmentColors[colorIndex];

      // Status color logic (optional override)
      let statusColor = color;
      if (round.status === 'completed') statusColor = '#10B981';
      else if (round.status === 'overdue') statusColor = '#EF4444';
      else if (round.status === 'in_progress') statusColor = '#3B82F6';

      return {
        id: round.id.toString(),
        title: round.title || 'جولة بدون عنوان',
        start: period.start,
        end: period.end,
        allDay: true, // Force all-day for cleaner multi-day view like the user asked
        backgroundColor: statusColor,
        borderColor: statusColor,
        extendedProps: {
          department: round.department,
          status: round.status,
          priority: round.priority,
          roundCode: round.round_code
        }
      };
    });
  }, [rounds]);

  // Handle calendar event click
  const handleEventClick = (info: any) => {
    console.log('Event clicked:', info.event)
    // Could open a modal with details here
    // const roundId = info.event.id;
    // navigate(`/rounds/evaluate/${roundId}`) // Example
    alert(`تفاصيل الجولة:\n${info.event.title}\nالقسم: ${info.event.extendedProps.department}\nالحالة: ${info.event.extendedProps.status}`)
  }

  // Handle date click
  const handleDateClick = (_: any) => {
    // Pre-fill date maybe?
    handleCreateRound();
  }

  // Show create form
  if (showCreateForm) {
    return <CompleteRoundForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff] flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">جاري تحميل التقويم</h3>
          <p className="text-lg text-slate-600">يرجى الانتظار...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-6 bg-gradient-to-r from-danger-50 to-rose-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-danger-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">خطأ في تحميل التقويم</h3>
          <p className="text-lg text-slate-600 mb-8">{error}</p>
          <Button
            onClick={refetch}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff]">
      <div className="p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 p-8 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">تقويم الجولات</h1>
                <p className="text-lg text-slate-600">عرض الجولات الشامل والجدول الزمني</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleCreateRound}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white flex items-center gap-3 px-8 py-3 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-6 h-6" />
                إنشاء جولة جديدة
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">إجمالي الجولات</p>
                <p className="text-3xl font-bold text-slate-800">{calendarEvents.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">مكتملة</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {calendarEvents.filter((e: any) => e.extendedProps.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">قيد التنفيذ</p>
                <p className="text-3xl font-bold text-blue-600">
                  {calendarEvents.filter((e: any) => e.extendedProps.status === 'in_progress').length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <PlayCircle className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">متأخرة</p>
                <p className="text-3xl font-bold text-rose-600">
                  {calendarEvents.filter((e: any) => e.extendedProps.status === 'overdue').length}
                </p>
              </div>
              <div className="p-3 bg-rose-50 rounded-full">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FullCalendar Component */}
        <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="p-6 bg-white" dir="ltr"> {/* Force LTR for calendar wrapper if needed, but CSS handles direction */}
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                locale="ar-sa"
                direction="rtl"
                buttonText={{
                  today: 'اليوم',
                  month: 'شهر',
                  week: 'أسبوع',
                  day: 'يوم',
                  list: 'قائمة'
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="auto"
                aspectRatio={1.8}
                dayMaxEvents={true}
                firstDay={7} // Sunday start
              />
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Can reuse similar legend from before if needed */}
        </div>
      </div>
    </div>
  )
}

export default RoundsCalendarView

