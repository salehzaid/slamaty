// Lightweight mock data used in development when backend is unreachable.
export const MOCK_ROUNDS = [
  {
    id: 1,
    round_code: 'R-1001',
    title: 'جولة سلامة عام',
    round_type: 'patient_safety',
    department: 'الطوارئ',
    assigned_to: ['أحمد', 'سارة', 'ليلى'],
    scheduled_date: new Date().toISOString(),
    status: 'scheduled',
    priority: 'medium',
    compliance_percentage: 0
  },
  {
    id: 2,
    round_code: 'R-1002',
    title: 'جولة تعقيم',
    round_type: 'infection_control',
    department: 'مختبر',
    assigned_to: ['مريم'],
    scheduled_date: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'in_progress',
    priority: 'high',
    compliance_percentage: 60
  }
]

export const MOCK_REPORTS = {
  compliance_rate: 72,
  rounds: { total: 12, completed: 7, in_progress: 3, overdue: 2 },
  capas: { total: 5, in_progress: 2, pending: 1, implemented: 1 }
}

export const MOCK_CAPAS = [
  { id: 1, title: 'تحسين النظافة', department: 'الطوارئ', assigned_to: 'أحمد', target_date: new Date().toISOString(), status: 'in_progress', severity: 4 },
  { id: 2, title: 'تحديث بروتوكول الأدوية', department: 'الصيدلية', assigned_to: 'سارة', target_date: null, status: 'pending', severity: 3 }
]

export const MOCK_DEPARTMENTS = [
  { id: 1, name: 'الطوارئ' },
  { id: 2, name: 'العناية المركزة' },
  { id: 3, name: 'المختبر' }
]

