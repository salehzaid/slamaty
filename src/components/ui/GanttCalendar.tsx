import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  Plus, 
  Search, 
  Filter,
  BarChart3,
  Target,
  Users,
  TrendingUp,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Input } from './input';

interface GanttEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string;
  assignedTo: string[];
  color: string;
  roundCode?: string;
  description?: string;
}

interface GanttCalendarProps {
  events: GanttEvent[];
  onEventClick?: (event: GanttEvent) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: () => void;
}

const GanttCalendar: React.FC<GanttCalendarProps> = ({
  events,
  onEventClick,
  onDateClick,
  onCreateEvent
}) => {
  // Force cache refresh - v2
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Get date range for display (week or month)
  const getDateRange = () => {
    if (viewMode === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start, end };
    } else {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay()); // Start from Sunday
      const end = new Date(start);
      end.setDate(end.getDate() + 6); // End on Saturday
      return { start, end };
    }
  };

  // Generate time slots (days) - must match getDateRange exactly
  const timeSlots = useMemo(() => {
    const { start, end } = getDateRange();
    const slots = [];
    const current = new Date(start);
    
    // Ensure we include both start and end dates
    while (current <= end) {
      slots.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    console.log('📅 Generated timeSlots:', {
      rangeStart: start.toLocaleDateString('en-US'),
      rangeEnd: end.toLocaleDateString('en-US'),
      slotsCount: slots.length,
      firstSlot: slots[0]?.toLocaleDateString('en-US'),
      lastSlot: slots[slots.length - 1]?.toLocaleDateString('en-US')
    });
    
    return slots;
  }, [currentDate, viewMode]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartments.length === 0 || 
                               selectedDepartments.includes(event.department);
      return matchesSearch && matchesDepartment;
    });
  }, [events, searchTerm, selectedDepartments]);

  // Get unique departments
  const departments = useMemo(() => {
    return Array.from(new Set(events.map(event => event.department)));
  }, [events]);

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    } else {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="w-3 h-3 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      default:
        return <Clock className="w-3 h-3 text-yellow-600" />;
    }
  };


  // Toggle department filter
  const toggleDepartment = (department: string) => {
    setSelectedDepartments(prev => 
      prev.includes(department) 
        ? prev.filter(d => d !== department)
        : [...prev, department]
    );
  };

  return (
    <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-6">
      {/* Enhanced Header with Stats */}
      <div className="space-y-6">
        {/* Main Header */}
        <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">تقويم الجولات الذكي</h1>
                  <p className="text-blue-100 text-lg">مخطط Gantt متطور لإدارة الجولات</p>
                </div>
              </div>
              
            <div className="flex items-center gap-3">
              {/* Calendar View Toggle */}
              <div className="flex bg-white/20 rounded-lg p-1 backdrop-blur-sm">
                <Button
                  onClick={() => setViewMode('week')}
                  size="sm"
                  className={`px-4 py-1 rounded-md transition-all duration-300 ${
                    viewMode === 'week' 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  أسبوعي
                </Button>
                <Button
                  onClick={() => setViewMode('month')}
                  size="sm"
                  className={`px-4 py-1 rounded-md transition-all duration-300 ${
                    viewMode === 'month' 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  شهري
                </Button>
              </div>
              
              <div className="h-8 w-px bg-white/30 mx-2"></div>
              
              <Button
                onClick={() => navigateDate('prev')}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={goToToday}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                اليوم
              </Button>
              <Button
                onClick={() => navigateDate('next')}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="h-8 w-px bg-white/30 mx-2"></div>
              
              <Button
                onClick={onCreateEvent}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-6 py-2 rounded-full font-bold"
              >
                <Plus className="w-5 h-5 mr-2" />
                إضافة جولة جديدة
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">إجمالي الجولات</p>
                  <p className="text-3xl font-bold text-white">{events.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">الجولات النشطة</p>
                  <p className="text-3xl font-bold text-white">
                    {events.filter(e => e.status === 'in_progress').length}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">الأقسام</p>
                  <p className="text-3xl font-bold text-white">{departments.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">معدل الإنجاز</p>
                  <p className="text-3xl font-bold text-white">
                    {events.length > 0 ? Math.round((events.filter(e => e.status === 'completed').length / events.length) * 100) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="🔍 ابحث في الجولات، الأقسام، أو المقيمين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setSelectedDepartments([])}
                variant={selectedDepartments.length === 0 ? 'default' : 'outline'}
                size="sm"
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedDepartments.length === 0 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                    : 'bg-white/50 border-2 border-gray-300 hover:border-blue-500'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                جميع الأقسام
              </Button>
              {departments.map((dept) => (
                <Button
                  key={dept}
                  onClick={() => toggleDepartment(dept)}
                  variant={selectedDepartments.includes(dept) ? 'default' : 'outline'}
                  size="sm"
                  className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                    selectedDepartments.includes(dept)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
                      : 'bg-white/50 border-2 border-gray-300 hover:border-purple-500'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {dept}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Gantt Chart */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Calendar Header Only */}
              <div className="sticky top-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white border-b-2 border-blue-200 z-20 shadow-lg">
                <div className="flex">
                  {timeSlots.map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    
                    return (
                      <div
                        key={index}
                        className={`flex-1 p-4 text-center border-r border-slate-600 transition-all duration-300 ${
                          isToday 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg' 
                            : isWeekend
                            ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                            : 'bg-gradient-to-br from-slate-700 to-slate-800'
                        }`}
                        style={{ minWidth: `${viewMode === 'month' ? 50 : 100}px` }}
                      >
                        <div className={`text-sm font-bold ${
                          isToday ? 'text-white' : 'text-slate-200'
                        }`}>
                          {viewMode === 'month' 
                            ? date.toLocaleDateString('en-US', { day: 'numeric' })
                            : date.toLocaleDateString('en-US', { weekday: 'short' })
                          }
                        </div>
                        {viewMode === 'week' && (
                          <>
                            <div className={`text-lg font-bold ${
                              isToday ? 'text-white' : 'text-slate-100'
                            }`}>
                              {date.toLocaleDateString('en-US', { day: 'numeric' })}
                            </div>
                            <div className={`text-xs ${
                              isToday ? 'text-blue-100' : 'text-slate-400'
                            }`}>
                              {date.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                          </>
                        )}
                        {isToday && (
                          <div className="mt-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Body - Each Round in Separate Row */}
              <div className="divide-y divide-slate-200">
                {filteredEvents.map((event, eventIndex) => {
                  const eventStart = new Date(event.startDate);
                  const eventEnd = new Date(event.endDate);
                  const { start: rangeStart } = getDateRange();
                  
                  // Calculate position and width with precise date alignment
                  // Find exact slot indices for start and end dates
                  const findSlotIndex = (targetDate: Date) => {
                    return timeSlots.findIndex(slot => 
                      slot.getFullYear() === targetDate.getFullYear() &&
                      slot.getMonth() === targetDate.getMonth() &&
                      slot.getDate() === targetDate.getDate()
                    );
                  };
                  
                  const startSlotIndex = findSlotIndex(eventStart);
                  const endSlotIndex = findSlotIndex(eventEnd);
                  
                  // If dates are not found in current range, skip this event
                  if (startSlotIndex === -1 || endSlotIndex === -1) {
                    console.log('⚠️ Event outside current range:', {
                      eventTitle: event.title,
                      eventStart: eventStart.toLocaleDateString('en-US'),
                      eventEnd: eventEnd.toLocaleDateString('en-US'),
                      rangeStart: rangeStart.toLocaleDateString('en-US'),
                      rangeEnd: getDateRange().end.toLocaleDateString('en-US')
                    });
                    return null;
                  }
                  
                  const totalDays = endSlotIndex - startSlotIndex + 1;
                  const leftPosition = (startSlotIndex / timeSlots.length) * 100;
                  const width = (totalDays / timeSlots.length) * 100;
                  
                  // Debug logging
                  console.log('📅 Timeline calculation:', {
                    eventTitle: event.title,
                    eventStart: eventStart.toLocaleDateString('en-US'),
                    eventEnd: eventEnd.toLocaleDateString('en-US'),
                    rangeStart: rangeStart.toLocaleDateString('en-US'),
                    rangeEnd: getDateRange().end.toLocaleDateString('en-US'),
                    timeSlotsLength: timeSlots.length,
                    startSlotIndex,
                    endSlotIndex,
                    leftPosition: `${leftPosition}%`,
                    width: `${width}%`,
                    totalDays,
                    slotStartDate: timeSlots[startSlotIndex]?.toLocaleDateString('en-US'),
                    slotEndDate: timeSlots[endSlotIndex]?.toLocaleDateString('en-US')
                  });
                  
                  // Dynamic colors based on status
                  const statusColors = {
                    'completed': 'from-green-400 to-emerald-500',
                    'in_progress': 'from-blue-400 to-cyan-500',
                    'scheduled': 'from-purple-400 to-indigo-500',
                    'overdue': 'from-red-400 to-pink-500'
                  };
                  
                  return (
                    <div key={event.id} className={`flex min-h-[80px] group hover:bg-slate-50/50 transition-all duration-300 ${
                      eventIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}>
                              {/* Timeline Lane Only - No Info Column */}
                              <div className="flex-1 relative bg-gradient-to-r from-slate-50 to-white">
                                {/* Background Grid with Date Labels */}
                                <div className="flex h-full">
                                  {timeSlots.map((date, dateIndex) => {
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    const isEventStart = startSlotIndex === dateIndex;
                                    const isEventEnd = endSlotIndex === dateIndex;
                                    
                                    return (
                                      <div
                                        key={dateIndex}
                                        className={`flex-1 border-r border-slate-200 transition-all duration-300 hover:bg-slate-100/50 relative ${
                                          isToday 
                                            ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-300' 
                                            : isWeekend
                                            ? 'bg-gradient-to-br from-slate-100 to-slate-200'
                                            : 'bg-white'
                                        }`}
                                        style={{ minWidth: `${viewMode === 'month' ? 50 : 100}px` }}
                                        onClick={() => onDateClick?.(date)}
                                      >
                                        {/* Event Start/End Markers on Grid */}
                                        {isEventStart && (
                                          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t"></div>
                                        )}
                                        {isEventEnd && (
                                          <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600 rounded-b"></div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                        
                        {/* Round Timeline Bar */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div
                            className="absolute top-2 pointer-events-auto"
                            style={{
                              left: `${leftPosition}%`,
                              width: `${width}%`,
                              height: '60px',
                              zIndex: 10
                            }}
                          >
                            <div
                              className={`h-full rounded-xl cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 border-2 border-white/50 backdrop-blur-sm relative ${
                                statusColors[event.status] || 'from-gray-400 to-slate-500'
                              } bg-gradient-to-r`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event);
                              }}
                              style={{
                                boxShadow: `0 8px 32px ${event.color}30, 0 0 0 1px ${event.color}20`
                              }}
                            >
                              {/* Start Date Indicator */}
                              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full border-2 border-blue-600 shadow-lg z-10"></div>
                              
                              {/* End Date Indicator */}
                              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full border-2 border-red-600 shadow-lg z-10"></div>
                              
                              {/* Date Labels */}
                              <div className="absolute -top-6 left-0 text-xs font-bold text-blue-600 bg-white px-1 rounded shadow-sm">
                                {event.startDate.toLocaleDateString('en-US')}
                              </div>
                              <div className="absolute -bottom-6 right-0 text-xs font-bold text-red-600 bg-white px-1 rounded shadow-sm">
                                {event.endDate.toLocaleDateString('en-US')}
                              </div>
                              <div className="p-2 h-full flex items-center text-white">
                                {/* All info in one row */}
                                <div className="flex items-center gap-2 w-full">
                                  <div className="p-1 bg-white/20 rounded-lg">
                                    {getStatusIcon(event.status)}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate drop-shadow-sm">
                                      {event.title}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-xs opacity-90">
                                    <div className="flex items-center gap-1">
                                      <Target className="w-3 h-3" />
                                      <span className="truncate max-w-20">{event.department}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="w-3 h-3" />
                                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {totalDays} أيام
                                      </span>
                                    </div>
                                    
                                    <div className="text-xs">
                                      {event.startDate.toLocaleDateString('en-US')} - {event.endDate.toLocaleDateString('en-US')}
                                    </div>
                                    
                                    {event.roundCode && (
                                      <div className="text-xs bg-white/20 px-2 py-1 rounded-full font-mono">
                                        {event.roundCode}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center gap-1">
                                      <div className={`w-2 h-2 rounded-full border border-white ${
                                        event.status === 'completed' ? 'bg-green-400' : 
                                        event.status === 'in_progress' ? 'bg-yellow-400' : 
                                        'bg-blue-400'
                                      }`}></div>
                                      <span className="text-xs font-bold drop-shadow-sm">
                                        {event.status === 'completed' ? 'مكتملة' : 
                                         event.status === 'in_progress' ? 'جارية' : 
                                         'مجدولة'}
                                      </span>
                                    </div>
                                    
                                    {event.priority === 'urgent' && (
                                      <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GanttCalendar;
