/**
 * API Request/Response Types
 * These types match the Django backend API responses
 */

import type { User, Task, Approval, Report, Announcement, Service, Comment, TaskFile } from './types';

// API Response types (what the backend actually returns)
export interface TaskFileAPIResponse {
  id: string;
  name: string;
  type: string;
  firebase_url: string;
  file_size: number;
  uploaded_by: User;  // Backend returns User object
  uploaded_at: string;
}

export interface CommentAPIResponse {
  id: string;
  content: string;
  created_by: User;  // Backend returns User object
  created_at: string;
}

export interface TaskListAPIResponse {
  id: string;
  title: string;
  category: string;
  service: string;
  service_name: string;
  start_date: string | null;
  due_date: string | null;
  status: string;
  assignees: User[];
  files_count: number;
  comments_count: number;
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface TaskAPIResponse {
  id: string;
  title: string;
  category: string;
  service: string;
  service_name: string;
  start_date: string | null;
  due_date: string | null;
  content: string;
  status: string;
  assignees: User[];  // Backend returns User objects
  cc: User[];  // Backend returns User objects
  related_tasks: string[];
  files: TaskFileAPIResponse[];  // Backend returns TaskFileAPIResponse objects
  comments: CommentAPIResponse[];
  created_by: User;  // Backend returns User object
  created_at: string;
  updated_at: string;
}

export interface ApprovalAPIResponse {
  id: string;
  task: TaskListAPIResponse;  // Backend returns Task object
  summary: string;
  links?: string[];
  status: string;
  team_leader_comment?: string | null;
  team_leader_approved_at?: string | null;
  team_leader_approved_by?: User | null;  // Backend returns User object
  ceo_comment?: string | null;
  ceo_approved_at?: string | null;
  ceo_approved_by?: User | null;  // Backend returns User object
  rejection_reason?: string | null;
  next_tasks?: TaskListAPIResponse[];  // Backend returns Task objects
  comments?: CommentAPIResponse[];
  comments_count?: number;  // For list serializer
  created_by: User;  // Backend returns User object
  created_at: string;
  updated_at?: string;
}

export interface ReportAPIResponse {
  id: string;
  type: string;
  week_number?: string | null;
  month?: string | null;
  year: string;
  content: string;
  tasks?: TaskListAPIResponse[];  // Backend returns Task objects
  tasks_count?: number;
  created_by: User;  // Backend returns User object
  created_at: string;
  updated_at?: string;
}

// Authentication
export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LogoutRequest {
  refresh: string;
}

// Tasks
export interface TaskCreateRequest {
  title: string;
  category: string;
  service: string;
  start_date?: string | null;
  due_date?: string | null;
  content: string;
  status: string;
  assignee_ids?: string[];
  cc_ids?: string[];
  related_task_ids?: string[];
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {}

export interface TaskFileUploadRequest {
  file: File;
  name: string;
  type: string;
}

export interface CommentCreateRequest {
  content: string;
}

// Approvals
export interface ApprovalCreateRequest {
  task_id: string;
  summary: string;
  links: string[];
  next_task_ids?: string[];
}

export interface ApprovalUpdateRequest extends Partial<ApprovalCreateRequest> {}

export interface ApprovalApproveRequest {
  approved: boolean;
  comment?: string;
  rejection_reason?: string;
}

// Reports
export interface ReportCreateRequest {
  type: 'WEEKLY' | 'MONTHLY';
  week_number?: string;
  month?: string;
  year: string;
  content: string;
  task_ids?: string[];
}

export interface ReportUpdateRequest extends Partial<ReportCreateRequest> {}

// Announcements
export interface PatchNoteItemAPIResponse {
  id: string;
  content: string;
  firebase_image_url?: string | null;
  order: number;
}

export interface AnnouncementAPIResponse {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  platform: string;
  deadline: string;
  approval?: ApprovalAPIResponse | null;
  version?: string | null;
  items?: PatchNoteItemAPIResponse[];
  created_by: User;
  created_at: string;
  updated_at?: string;
}

export interface PatchNoteCreateRequest {
  title: string;
  subtitle?: string;
  platform: string;
  deadline: string;
  approval_id?: string;
  version: string;
  items?: Array<{
    content: string;
    image?: File;
  }>;
}

export interface UrgentAnnouncementCreateRequest {
  title: string;
  subtitle?: string;
  content: string;
  platform: string;
  deadline: string;
}

export interface AnnouncementUpdateRequest {
  title?: string;
  subtitle?: string;
  content?: string;
  platform?: string;
  deadline?: string;
  approval_id?: string;
  version?: string;
}

// Services
export interface ServiceCreateRequest {
  name: string;
}

// Statistics
export interface DashboardStatistics {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByCategory: Record<string, number>;
  tasksByService: Record<string, number>;
  pendingApprovals: number;
  recentTasks: Task[];
  upcomingDeadlines: Task[];
}

export interface UserTaskStatistics {
  userId: string;
  totalAssigned: number;
  completedTasks: number;
  inProgressTasks: number;
  tasksByCategory: Record<string, number>;
  tasksByService: Record<string, number>;
  tasksByStatus: Record<string, number>;
}

// Users
export interface UserRoleUpdateRequest {
  role: 'CEO' | 'TEAM_LEADER' | 'MEMBER';
}

// Query Parameters
export interface TaskQueryParams {
  status?: string;
  category?: string;
  service?: string;
  assignee?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ApprovalQueryParams {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ReportQueryParams {
  type?: string;
  year?: string;
  month?: string;
  weekNumber?: string;
  limit?: number;
  offset?: number;
}

export interface AnnouncementQueryParams {
  type?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}

// API Error
export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
