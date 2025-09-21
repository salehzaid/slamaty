import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, PlayCircle, Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';

interface TimelineEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string;
  assignedTo: string[];
  color: string;
}

interface TimelineCalendarProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: () => void;
}

const TimelineCalendar: React.FC<TimelineCalendarProps> = ({ 
  events, 
  onEventClick, 
  onDateClick, 
  onCreateEvent 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Calculate round period based on deadline
  const calculateRoundPeriod = (scheduledDate: Date, deadline?: Date) => {
    if (!deadline) {
      // If no deadline, use scheduled date as both start and end
      return {
        start: scheduledDate,
        end: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000) // Add 1 day
      };
    }
    
    // Calculate period from scheduled date to deadline
    return {
      start: scheduledDate,
      end: deadline
    };
  };

  // Get unique departments from events
  const departments = useMemo(() => {
    const deptSet = new Set(events.map(event => event.department));
    return Array.from(deptSet);
  }, [events]);

  // Filter events based on search and department filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartments.length === 0 || 
                               selectedDepartments.includes(event.department);
      return matchesSearch && matchesDepartment;
    });
  }, [events, searchTerm, selectedDepartments]);

  // Get current week or month range
  const getDateRange = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return { start: startOfWeek, end: endOfWeek };
    } else {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start: startOfMonth, end: endOfMonth };
    }
  };

  // Generate time slots for the timeline
  const generateTimeSlots = () => {
    const slots = [];
    const { start, end } = getDateRange();
    const current = new Date(start);
    
    while (current <= end) {
      slots.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return slots;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart <= date && eventEnd >= date;
    });
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

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'urgent': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'week') {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      } else {
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      }
      return newDate;
    });
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle department filter
  const toggleDepartment = (department: string) => {
    setSelectedDepartments(prev => 
      prev.includes(department) 
        ? prev.filter(d => d !== department)
        : [...prev, department]
    );
  };

  const timeSlots = generateTimeSlots();
  const { start: rangeStart, end: rangeEnd } = getDateRange();

  return (
    <div className="w-full">
      {/* Header Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">تقويم الجولات الزمني</h2>
                <p className="text-gray-600">
                  {viewMode === 'week' ? 'عرض أسبوعي' : 'عرض شهري'} - 
                  {rangeStart.toLocaleDateString('ar-SA')} إلى {rangeEnd.toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={onCreateEvent}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة جولة
              </Button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigateDate('prev')}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={goToToday}
                  variant="outline"
                  size="sm"
                >
                  اليوم
                </Button>
                <Button
                  onClick={() => navigateDate('next')}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setViewMode('week')}
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                >
                  أسبوع
                </Button>
                <Button
                  onClick={() => setViewMode('month')}
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                >
                  شهر
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">التكبير:</span>
                <Button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  variant="outline"
                  size="sm"
                >
                  -
                </Button>
                <span className="text-sm font-medium w-8 text-center">{zoom}x</span>
                <Button
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  variant="outline"
                  size="sm"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الجولات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">الأقسام:</span>
              {departments.map(dept => (
                <Button
                  key={dept}
                  onClick={() => toggleDepartment(dept)}
                  variant={selectedDepartments.includes(dept) ? 'default' : 'outline'}
                  size="sm"
                >
                  {dept}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Timeline Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="flex">
                  <div className="w-48 p-4 border-r border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">الأقسام / المستخدمين</h3>
                  </div>
                  <div className="flex-1 flex">
                    {timeSlots.map((date, index) => (
                      <div
                        key={index}
                        className={`flex-1 p-4 text-center border-r border-gray-200 ${
                          date.toDateString() === new Date().toDateString() 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white'
                        }`}
                        style={{ minWidth: `${120 * zoom}px` }}
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {date.toLocaleDateString('ar-SA', { weekday: 'short' })}
                        </div>
                        <div className="text-xs text-gray-600">
                          {date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline Body */}
              <div className="divide-y divide-gray-200">
                {departments.map((department, deptIndex) => {
                  const departmentEvents = filteredEvents.filter(event => event.department === department);
                  
                  return (
                    <div key={department} className="flex min-h-[80px]">
                      {/* Department Name */}
                      <div className="w-48 p-4 border-r border-gray-200 bg-gray-50 flex items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{department}</div>
                          <div className="text-sm text-gray-600">
                            {departmentEvents.length} جولة
                          </div>
                        </div>
                      </div>
                      
                      {/* Timeline Lane */}
                      <div className="flex-1 relative">
                        <div className="flex h-full">
                          {timeSlots.map((date, dateIndex) => {
                            const dayEvents = getEventsForDate(date).filter(event => event.department === department);
                            
                            return (
                              <div
                                key={dateIndex}
                                className={`flex-1 border-r border-gray-200 relative ${
                                  date.toDateString() === new Date().toDateString() 
                                    ? 'bg-blue-50' 
                                    : 'bg-white'
                                }`}
                                style={{ minWidth: `${120 * zoom}px` }}
                                onClick={() => onDateClick?.(date)}
                              >
                                <div className="h-full p-2 space-y-1">
                                  {dayEvents.map((event, eventIndex) => (
                                    <div
                                      key={event.id}
                                      className={`text-xs p-2 rounded cursor-pointer hover:shadow-sm transition-all duration-200 border ${getPriorityColor(event.priority)}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEventClick?.(event);
                                      }}
                                      style={{
                                        backgroundColor: event.color + '20',
                                        borderColor: event.color,
                                        color: event.color
                                      }}
                                    >
                                      <div className="flex items-center gap-1 mb-1">
                                        {getStatusIcon(event.status)}
                                        <span className="font-medium truncate">{event.title}</span>
                                      </div>
                                      <div className="text-xs opacity-75">
                                        {event.startDate.toLocaleTimeString('ar-SA', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })} - {event.endDate.toLocaleTimeString('ar-SA', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
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

      {/* Legend */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">مفتاح الألوان والرموز</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">مجدولة</p>
                <p className="text-sm text-gray-500">جولات مجدولة للمستقبل</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">قيد التنفيذ</p>
                <p className="text-sm text-gray-500">جولات قيد التنفيذ حالياً</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">مكتملة</p>
                <p className="text-sm text-gray-500">جولات مكتملة بنجاح</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">متأخرة</p>
                <p className="text-sm text-gray-500">جولات متأخرة عن الموعد</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineCalendar;
