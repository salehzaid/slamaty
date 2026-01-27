// User roles enum
export type UserRole = 'super_admin' | 'quality_manager' | 'department_head' | 'assessor' | 'viewer';

// Round status enum
export type RoundStatus = 'scheduled' | 'in_progress' | 'pending_review' | 'under_review' | 'completed' | 'cancelled' | 'on_hold' | 'overdue';

// Round types enum (legacy - will be replaced by RoundTypeSettings)
export type RoundType = 'patient_safety' | 'infection_control' | 'hygiene' | 'medication_safety' | 'equipment_safety' | 'environmental' | 'general';

// Round Type Settings interface
export interface RoundTypeSettings {
  id: number;
  name: string;
  nameEn?: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// CAPA status enum
export type CapaStatus = 'pending' | 'assigned' | 'in_progress' | 'implemented' | 'verification' | 'verified' | 'rejected' | 'closed';

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string;
  phone?: string;
  position?: string;
  photo_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

// Department interface
export interface Department {
  id: number;
  name: string;
  nameEn?: string;
  code: string;
  description?: string;
  location?: string;
  floor?: string;
  building?: string;
  managers?: number[]; // Array of user IDs for department managers
  isActive: boolean;
  createdAt?: string;
}

// Round interface
export interface Round {
  id: number;
  roundCode: string;
  title: string;
  description?: string;
  roundType: RoundType;
  department: string;
  assignedTo: string[];
  scheduledDate: string;
  deadline?: string; // Deadline for round completion
  endDate?: string; // Calculated end date
  status: RoundStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  compliancePercentage: number;
  notes?: string;
  evaluation_items?: number[]; // IDs of selected evaluation items
  selected_categories?: number[]; // IDs of selected categories
  createdBy: string;
  createdAt: string;
}

// CAPA interface
export interface Capa {
  id: number;
  title: string;
  description: string;
  roundId?: number;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: CapaStatus;
  assignedTo?: string;
  assignedToId?: number; // User ID of the assigned manager
  assignedManager?: User; // Details of the assigned manager
  evaluationItemId?: number; // Link to evaluation item
  targetDate: string;
  createdBy: string;
  createdById?: number;
  creator?: User; // Details of the creator
  createdAt: string;
  updatedAt?: string;
  riskScore?: number;
}

// Dashboard Stats interface
export interface DashboardStats {
  totalRounds: number;
  completedRounds: number;
  pendingRounds: number;
  overdueRounds: number;
  averageCompliance: number;
  totalCapa: number;
  openCapa: number;
  closedCapa: number;
  overdueCapa: number;
}

// Badge types
export type BadgeType = 'number' | 'text' | 'new' | 'featured';

export interface Badge {
  type: BadgeType;
  value: string | number;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
}

// Navigation item interface
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
  badge?: Badge;
}

// Evaluation Category interface
export interface EvaluationCategory {
  id: number;
  name: string;
  nameEn?: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

// Evaluation Item interface
export interface EvaluationItem {
  id: number;
  code: string;
  title: string;
  titleEn?: string;
  description?: string;
  objective?: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  isActive: boolean;
  isRequired: boolean;
  weight: number;
  riskLevel: 'MINOR' | 'MAJOR' | 'CRITICAL';
  evidenceType: 'OBSERVATION' | 'DOCUMENT' | 'INTERVIEW' | 'MEASUREMENT';
  guidanceAr?: string;
  guidanceEn?: string;
  standardVersion?: string;
  createdAt: string;
}