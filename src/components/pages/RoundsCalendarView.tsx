import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRounds } from '@/hooks/useRounds'
import CompleteRoundForm from '@/components/forms/CompleteRoundForm'
import GanttCalendar from '@/components/ui/GanttCalendar'
import { apiClient } from '@/lib/api'
import { 
  Plus, 
  Calendar as CalendarIcon, 
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

  // Calculate round period based on database data: scheduled_date and end_date
  const calculateRoundPeriod = (scheduledDate: Date, endDate?: Date, deadline?: Date) => {
    // Priority 1: Use end_date from database (calculated from scheduled_date + deadline days)
    if (endDate) {
      console.log('📅 Using database end_date for timeline:', {
        scheduledDate: scheduledDate.toLocaleDateString('en-US'),
        endDate: endDate.toLocaleDateString('en-US'),
        duration: Math.ceil((endDate.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24)) + ' days',
        source: 'database end_date column'
      });
      return {
        start: scheduledDate, // من عمود scheduled_date
        end: endDate // من عمود end_date
      };
    }
    
    // Priority 2: Fallback to deadline if end_date not available
    if (deadline) {
      console.log('📅 Using database deadline for timeline:', {
        scheduledDate: scheduledDate.toLocaleDateString('en-US'),
        deadline: deadline.toLocaleDateString('en-US'),
        duration: Math.ceil((deadline.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24)) + ' days',
        source: 'database deadline column'
      });
      return {
        start: scheduledDate, // من عمود scheduled_date
        end: deadline // من عمود deadline
      };
    }
    
    // Priority 3: Default fallback (should not happen in normal cases)
    console.log('📅 Using default 1-day period (no database end_date or deadline):', {
      scheduledDate: scheduledDate.toLocaleDateString('en-US'),
      defaultEnd: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
      source: 'default calculation'
    });
    return {
      start: scheduledDate, // من عمود scheduled_date
      end: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000) // حساب افتراضي
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
      const scheduledDate = round.scheduled_date ? new Date(round.scheduled_date) : new Date();
      const endDate = round.end_date ? new Date(round.end_date) : undefined;
      const deadline = round.deadline ? new Date(round.deadline) : undefined;
      const period = calculateRoundPeriod(scheduledDate, endDate, deadline);
      
      // تسجيل للتشخيص - تأكيد استخدام البيانات من قاعدة البيانات
      console.log('📅 Round timeline calculation from database:', {
        roundCode: round.round_code,
        title: round.title,
        rawScheduledDate: round.scheduled_date,
        rawEndDate: round.end_date,
        rawDeadline: round.deadline,
        databaseScheduledDate: scheduledDate.toLocaleDateString('en-US'),
        databaseEndDate: endDate ? endDate.toLocaleDateString('en-US') : 'None',
        databaseDeadline: deadline ? deadline.toLocaleDateString('en-US') : 'None',
        calculatedStart: period.start.toLocaleDateString('en-US'),
        calculatedEnd: period.end.toLocaleDateString('en-US'),
        finalEndDate: (endDate || period.end).toLocaleDateString('en-US'),
        duration: Math.ceil(((endDate || period.end).getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)) + ' days',
        dataSource: endDate ? 'database end_date column' : deadline ? 'database deadline column' : 'default calculation'
      });
      
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

      // استخدام endDate الفعلي من قاعدة البيانات إذا كان متوفراً، وإلا استخدام period.end
      const finalEndDate = endDate || period.end;
      
      console.log('📅 Final end date calculation from database:', {
        roundCode: round.round_code,
        title: round.title,
        databaseEndDate: endDate ? endDate.toLocaleDateString('en-US') : 'None',
        calculatedPeriodEnd: period.end.toLocaleDateString('en-US'),
        finalEndDate: finalEndDate.toLocaleDateString('en-US'),
        dataSource: endDate ? 'database end_date column' : 'calculated period'
      });

      return {
        id: round.id.toString(),
        title: round.title || 'جولة بدون عنوان',
        startDate: period.start, // من عمود scheduled_date في قاعدة البيانات
        endDate: finalEndDate, // من عمود end_date في قاعدة البيانات
        status: round.status as 'scheduled' | 'in_progress' | 'completed' | 'overdue',
        priority: round.priority as 'low' | 'medium' | 'high' | 'urgent',
        department: round.department || 'غير محدد',
        assignedTo: assignedTo,
        color: color,
        // إضافة معلومات إضافية للعرض
        scheduledDate: scheduledDate, // من عمود scheduled_date
        actualEndDate: endDate, // من عمود end_date
        deadline: deadline, // من عمود deadline
        roundCode: round.round_code,
        description: round.description
      };
    });
  }, [rounds]);

  // Convert rounds to calendar events (for backward compatibility) - removed unused variable

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
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">إجمالي الجولات</p>
                  <p className="text-3xl font-bold">{timelineEvents.length}</p>
                  <p className="text-blue-200 text-xs mt-1">جميع الجولات المسجلة</p>
                </div>
                <Target className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">مكتملة</p>
                  <p className="text-3xl font-bold">
                    {timelineEvents.filter((r: any) => r.status === 'completed').length}
                  </p>
                  <p className="text-green-200 text-xs mt-1">
                    {timelineEvents.length > 0 ? 
                      Math.round((timelineEvents.filter((r: any) => r.status === 'completed').length / timelineEvents.length) * 100) : 0
                    }% من إجمالي الجولات
                  </p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">قيد التنفيذ</p>
                  <p className="text-3xl font-bold">
                    {timelineEvents.filter((r: any) => r.status === 'in_progress').length}
                  </p>
                  <p className="text-yellow-200 text-xs mt-1">جولات نشطة حالياً</p>
                </div>
                <PlayCircle className="w-12 h-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">متأخرة</p>
                  <p className="text-3xl font-bold">
                    {timelineEvents.filter((r: any) => r.status === 'overdue').length}
                  </p>
                  <p className="text-red-200 text-xs mt-1">تتطلب متابعة عاجلة</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Calendar View */}
        <GanttCalendar
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
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <Clock className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-900">مجدولة</p>
                  <p className="text-sm text-gray-500">جولات مجدولة للمستقبل</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <PlayCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">قيد التنفيذ</p>
                  <p className="text-sm text-gray-500">جولات قيد التنفيذ حالياً</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">مكتملة</p>
                  <p className="text-sm text-gray-500">جولات مكتملة بنجاح</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-gray-900">متأخرة</p>
                  <p className="text-sm text-gray-500">جولات متأخرة عن الموعد</p>
                </div>
              </div>
            </div>
            
            {/* معلومات إضافية */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">معلومات العرض</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p className="font-medium">📅 تواريخ الجولات:</p>
                  <p>يتم عرض تاريخ بداية ونهاية كل جولة بوضوح</p>
                </div>
                <div>
                  <p className="font-medium">🎯 كود الجولة:</p>
                  <p>كل جولة لها كود فريد للتعريف السريع</p>
                </div>
                <div>
                  <p className="font-medium">👥 المقيمون:</p>
                  <p>عرض أسماء المقيمين المسؤولين عن كل جولة</p>
                </div>
                <div>
                  <p className="font-medium">🏢 الأقسام:</p>
                  <p>تصنيف الجولات حسب الأقسام المختلفة</p>
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
