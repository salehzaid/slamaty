import React, { useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Filter,
  Search,
  Plus,
  ArrowRight,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useRounds } from '@/hooks/useRounds'
import { cn } from '@/lib/utils'
import './CalendarStyles.css'

const RoundsCalendarView: React.FC = () => {
  const { data: rounds } = useRounds()
  const calendarRef = useRef<FullCalendar>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeView, setActiveView] = useState('dayGridMonth')

  // Convert rounds data to FullCalendar events
  const events = rounds.map(round => ({
    id: String(round.id),
    title: round.title,
    start: round.scheduledDate,
    end: round.endDate || round.scheduledDate,
    extendedProps: {
      status: round.status,
      department: round.department,
      type: round.roundType
    },
    className: `event-status-${(round.status || '').toLowerCase()}`
  }))

  const handlePrev = () => {
    const api = calendarRef.current?.getApi()
    api?.prev()
    setCurrentDate(api?.getDate() || new Date())
  }

  const handleNext = () => {
    const api = calendarRef.current?.getApi()
    api?.next()
    setCurrentDate(api?.getDate() || new Date())
  }

  const handleToday = () => {
    const api = calendarRef.current?.getApi()
    api?.today()
    setCurrentDate(api?.getDate() || new Date())
  }

  const handleViewChange = (view: string) => {
    const api = calendarRef.current?.getApi()
    api?.changeView(view)
    setActiveView(view)
  }

  const renderEventContent = (eventInfo: any) => {
    const { status, type } = eventInfo.event.extendedProps
    return (
      <div className="p-1 overflow-hidden">
        <div className="flex items-center gap-1 mb-1">
          <Badge className="text-[10px] px-1 py-0 h-4 bg-white/20 border-none text-white whitespace-nowrap">
            {type}
          </Badge>
        </div>
        <div className="font-semibold text-xs truncate">{eventInfo.event.title}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">تقويم الجولات</h2>
                  <p className="text-sm text-slate-500">عرض وإدارة الجولات المجدولة</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("rounded-lg h-9", activeView === 'dayGridMonth' && "bg-blue-50 text-blue-600")}
                  onClick={() => handleViewChange('dayGridMonth')}
                >
                  شهر
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("rounded-lg h-9", activeView === 'timeGridWeek' && "bg-blue-50 text-blue-600")}
                  onClick={() => handleViewChange('timeGridWeek')}
                >
                  أسبوع
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("rounded-lg h-9", activeView === 'timeGridDay' && "bg-blue-50 text-blue-600")}
                  onClick={() => handleViewChange('timeGridDay')}
                >
                  يوم
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 mr-2">
                  <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200" onClick={handlePrev}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="h-9 border-slate-200 text-sm font-medium px-4" onClick={handleToday}>
                    اليوم
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200" onClick={handleNext}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 shadow-sm transition-all hover:shadow-md">
                  <Plus className="w-4 h-4 ml-2" />
                  جولة جديدة
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              events={events}
              locale="ar"
              direction="rtl"
              firstDay={0} // Sunday
              eventContent={renderEventContent}
              height="auto"
              dayMaxEvents={3}
              stickyHeaderDates={true}
              nowIndicator={true}
              allDaySlot={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'نشطة', color: 'bg-blue-500', count: rounds.filter(r => r.status === 'in_progress').length },
          { label: 'قيد الانتظار', color: 'bg-amber-500', count: rounds.filter(r => r.status === 'scheduled').length },
          { label: 'مكتملة', color: 'bg-emerald-500', count: rounds.filter(r => r.status === 'completed').length },
          { label: 'متأخرة', color: 'bg-red-500', count: rounds.filter(r => r.status === 'overdue').length }
        ].map(status => (
          <Card key={status.label} className="border-none shadow-sm shadow-slate-200/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", status.color)} />
                <span className="text-sm font-medium text-slate-600">{status.label}</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{status.count}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default RoundsCalendarView
