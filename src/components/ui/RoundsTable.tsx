import React, { useState } from 'react'
import AssignedUsers from '@/components/ui/AssignedUsers'
import { Button } from '@/components/ui/button'

interface Round {
  id: number
  department?: string
  roundCode?: string
  scheduledDate?: string
  status?: string
  priority?: string
  assignedTo?: string[]
}

interface Props {
  rounds: Round[]
  onView?: (id: number) => void
  onEdit?: (r: Round) => void
  onDelete?: (id: number, title?: string) => void
}

const RoundsTable: React.FC<Props> = ({ rounds, onView, onEdit, onDelete }) => {
  const [sortBy, setSortBy] = useState<'date' | 'department'>('date')
  const sorted = [...rounds].sort((a, b) => {
    if (sortBy === 'date') {
      const da = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0
      const db = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0
      return da - db
    }
    return (a.department || '').localeCompare(b.department || '')
  })

  return (
    <div className="overflow-auto bg-white rounded-md border border-gray-200 p-2">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">عرض الجدول</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setSortBy('date')} aria-pressed={sortBy === 'date'}>ترتيب بالتاريخ</Button>
          <Button variant="ghost" onClick={() => setSortBy('department')} aria-pressed={sortBy === 'department'}>ترتيب بالقسم</Button>
        </div>
      </div>

      <table className="min-w-full border-collapse table-auto">
        <thead>
          <tr className="text-xs text-gray-500 text-right">
            <th className="p-2">القسم</th>
            <th className="p-2">التاريخ</th>
            <th className="p-2">الحالة</th>
            <th className="p-2">الأولوية</th>
            <th className="p-2">المسؤول</th>
            <th className="p-2">كود</th>
            <th className="p-2">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.id} className="text-sm text-gray-700 border-t">
              <td className="p-2 align-top">{r.department || '—'}</td>
              <td className="p-2 align-top">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : 'غير محدد'}</td>
              <td className="p-2 align-top">{r.status}</td>
              <td className="p-2 align-top">{r.priority}</td>
              <td className="p-2 align-top">{/* @ts-ignore */}<AssignedUsers users={r.assignedTo} maxVisible={2} /></td>
              <td className="p-2 align-top font-mono">{r.roundCode || '—'}</td>
              <td className="p-2 align-top">
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => onView && onView(r.id)}>عرض</Button>
                  <Button variant="ghost" onClick={() => onEdit && onEdit(r)}>تعديل</Button>
                  <Button variant="ghost" className="text-red-600" onClick={() => onDelete && onDelete(r.id, r.roundCode)} aria-label={`حذف الجولة ${r.roundCode || r.id}`}>حذف</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RoundsTable

