import { Round, Capa, DashboardStats, Department } from '../types';

// No mock data - all data comes from database via API calls
// This file is kept for type definitions only

export const mockDepartments: Department[] = [];
export const mockRounds: Round[] = [];
export const mockCapa: Capa[] = [];

export const mockDashboardStats: DashboardStats = {
  totalRounds: 0,
  completedRounds: 0,
  pendingRounds: 0,
  overdueRounds: 0,
  averageCompliance: 0,
  totalCapa: 0,
  openCapa: 0,
  closedCapa: 0,
  overdueCapa: 0
};