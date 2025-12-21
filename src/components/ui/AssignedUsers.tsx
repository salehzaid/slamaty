import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  users?: Array<string>
  maxVisible?: number
}

const isNumeric = (s: string) => /^\d+$/.test(s.trim())

const AssignedUsers: React.FC<Props> = ({ users = [], maxVisible = 3 }) => {
  const [open, setOpen] = useState(false)

  const filtered = users.filter(u => !!u && !isNumeric(u))
  if (!filtered || filtered.length === 0) {
    return <span className="text-gray-500">غير محدد</span>
  }

  const visible = filtered.slice(0, maxVisible)
  const remaining = filtered.length - visible.length

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <span className="truncate">{visible.join(', ')}</span>
        {remaining > 0 && (
          <button
            onClick={() => setOpen(true)}
            className="text-sm text-gray-600 underline ml-1"
            aria-expanded={open}
            aria-controls="assigned-users-modal"
          >
            +{remaining} آخر{remaining > 1 ? 'ين' : ''}
          </button>
        )}
      </div>

      {open && (
        <div
          id="assigned-users-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="bg-white rounded-lg shadow-lg z-60 max-w-md w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">المسؤولون عن الجولة</h3>
              <Button onClick={() => setOpen(false)} variant="ghost" className="text-sm px-2 py-1">إغلاق</Button>
            </div>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              {filtered.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

export default AssignedUsers

