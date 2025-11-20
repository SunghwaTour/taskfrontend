export type UserRole = 'CEO' | 'TEAM_LEADER' | 'MEMBER' | 'VISITOR'

export interface User {
  id: string
  name: string
  password?: string  // Optional since API doesn't return password
  role: UserRole
}

// Task types
export type TaskCategory = '일반' | '기획' | '디자인' | '개발' | '배포'
export type TaskStatus = 'BACKLOG' | 'TODO' | 'DOING' | 'DONE'
export type ServiceType = 'TRP' | 'RPA-D' | 'Kingbus' | 'Link' | 'Link-M' | 'Link-TRP' | 'Link-D' | '기타'

export interface TaskFile {
  id: string
  name: string
  type: '기안서' | '품의서' | '기타'
  url: string
  firebaseUrl: string
  size: number
  uploadedBy: string
  uploadedAt: string
}

export interface Task {
  id: string
  title: string
  category: TaskCategory
  relatedTasks: string[]
  service: ServiceType
  startDate: string | null
  dueDate: string | null
  content: string
  files: TaskFile[]
  assignees: string[]
  cc: string[]
  status: TaskStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  comments: Comment[]
}

// Approval types
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Approval {
  id: string
  taskId: string
  taskTitle?: string  // Task title from API response
  summary: string
  links: string[]
  status: ApprovalStatus
  teamLeaderComment?: string
  teamLeaderApprovedAt?: string
  teamLeaderApprovedBy?: string
  ceoComment?: string
  ceoApprovedAt?: string
  ceoApprovedBy?: string
  rejectionReason?: string
  nextTasks: string[]
  createdBy: string
  createdAt: string
  comments: Comment[]
}

// Comment type
export interface Comment {
  id: string
  content: string
  createdBy: string
  createdAt: string
}

// Report types
export type ReportType = 'WEEKLY' | 'MONTHLY'

export interface Report {
  id: string
  type: ReportType
  weekNumber?: string
  month?: string
  year: string
  tasks: string[]
  content: string
  createdBy: string
  createdAt: string
}

// Patch Note types
export type PlatformType = 'Android' | 'iOS' | 'Web'

export interface PatchNoteItem {
  id: string
  content: string
  image?: string
}

export interface PatchNote {
  id: string
  title: string
  approvalId: string
  platform: PlatformType
  version: string
  items: PatchNoteItem[]
  deadline: string
  createdBy: string
  createdAt: string
}

// Announcement types for urgent announcements and patch notes
export type AnnouncementType = 'urgent' | 'patch'
export type UrgentPlatformType = 'Android' | 'iOS'

export interface Announcement {
  id: string
  type: AnnouncementType
  title: string
  subtitle?: string // For urgent announcements
  content?: string // For urgent announcements
  platform: PlatformType | UrgentPlatformType
  deadline: string
  // For patch notes
  approvalId?: string
  version?: string
  items?: PatchNoteItem[]
  createdBy: string
  createdAt: string
}

// TRP API types
export interface TRPAuthenticatedUser {
  user_id: string
  name: string
  role: string  // '운전원', '관리자', '최고관리자' 등
  position: string  // '팀장', '대리' 등
}

export interface TRPLoginResponse {
  result: 'true' | 'false'
  data: {
    access: string
    refresh: string
    authenticatedUser: TRPAuthenticatedUser
    authenticated_user: TRPAuthenticatedUser
  } | number
  message: string | Record<string, string[]>
}

export interface TRPRefreshResponse {
  result: 'true' | 'false'
  data: {
    access: string
    refresh: string
    authenticated_user: TRPAuthenticatedUser
  } | number
  message: string | Record<string, string[]>
}
