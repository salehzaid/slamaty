import React from 'react';
import { Card, CardContent } from './card';
import { Clock, CheckCircle2, PlayCircle, AlertCircle, Calendar } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
}

interface TimelineChartProps {
  events: TimelineEvent[];
  title?: string;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ events, title = "الجدول الزمني للجولات" }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 border-blue-200';
      case 'overdue':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-yellow-100 border-yellow-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="bg-white rounded-2xl shadow-xl border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="space-y-8">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-6">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority)}`}></div>
                </div>
                
                {/* Event card */}
                <div className={`flex-1 p-6 rounded-2xl border-2 ${getStatusColor(event.status)} hover:shadow-lg transition-all duration-300`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(event.status)}
                      <h4 className="text-xl font-bold text-gray-900">{event.title}</h4>
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-4 leading-relaxed">{event.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {event.priority === 'urgent' ? 'عاجلة' :
                       event.priority === 'high' ? 'عالية' :
                       event.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === 'completed' ? 'bg-green-100 text-green-800' :
                      event.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status === 'completed' ? 'مكتملة' :
                       event.status === 'in_progress' ? 'قيد التنفيذ' :
                       event.status === 'overdue' ? 'متأخرة' : 'مجدولة'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sortedEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">لا توجد أحداث مجدولة</h4>
            <p className="text-gray-500">لم يتم العثور على جولات لعرضها في الجدول الزمني</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineChart;
