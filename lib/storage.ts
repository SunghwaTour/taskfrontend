/**
 * Storage layer - API integration
 * All functions now call the Django backend API instead of localStorage
 */

import apiClient, { setTokens, clearTokens, getAccessToken } from './api-client';
import type {
  User,
  Task,
  Approval,
  Report,
  Announcement,
  ServiceType,
} from './types';
import type {
  LoginRequest,
  LoginResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskAPIResponse,
  TaskListAPIResponse,
  CommentAPIResponse,
  ApprovalAPIResponse,
  ApprovalCreateRequest,
  ApprovalUpdateRequest,
  ReportAPIResponse,
  ReportCreateRequest,
  ReportUpdateRequest,
  AnnouncementAPIResponse,
  PatchNoteCreateRequest,
  UrgentAnnouncementCreateRequest,
  UserRoleUpdateRequest,
  TaskQueryParams,
} from './api-types';

// ========================================
// Helper Functions
// ========================================

/**
 * Transform API Task response to frontend Task type
 * Backend returns User objects for assignees/cc/created_by, but frontend expects IDs
 */
function transformTaskAPIResponse(apiTask: TaskAPIResponse): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    category: apiTask.category as any,
    service: apiTask.service as any,
    startDate: apiTask.start_date,
    dueDate: apiTask.due_date,
    content: apiTask.content,
    status: apiTask.status as any,
    assignees: apiTask.assignees?.map(u => u.id) || [],
    cc: apiTask.cc?.map(u => u.id) || [],
    relatedTasks: apiTask.related_tasks || [],
    files: apiTask.files?.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type as any,
      url: f.firebase_url,
      firebaseUrl: f.firebase_url,
      size: f.file_size,
      uploadedBy: typeof f.uploaded_by === 'object' ? f.uploaded_by.id : f.uploaded_by as any,
      uploadedAt: f.uploaded_at,
    })) || [],
    comments: apiTask.comments?.map(c => ({
      id: c.id,
      content: c.content,
      createdBy: typeof c.created_by === 'object' ? c.created_by.id : c.created_by as any,
      createdAt: c.created_at,
    })) || [],
    createdBy: typeof apiTask.created_by === 'object' ? apiTask.created_by.id : apiTask.created_by as any,
    createdAt: apiTask.created_at,
    updatedAt: apiTask.updated_at,
  };
}

/**
 * Transform API Approval response to frontend Approval type
 * Backend returns nested objects (Task, User) but frontend expects IDs
 */
function transformApprovalAPIResponse(apiApproval: ApprovalAPIResponse): Approval {
  const transformed = {
    id: apiApproval.id,
    taskId: typeof apiApproval.task === 'object' ? apiApproval.task.id : apiApproval.task as any,
    taskTitle: typeof apiApproval.task === 'object' ? apiApproval.task.title : undefined,
    summary: apiApproval.summary,
    links: apiApproval.links || [],
    status: apiApproval.status as any,
    teamLeaderComment: apiApproval.team_leader_comment || undefined,
    teamLeaderApprovedAt: apiApproval.team_leader_approved_at || undefined,
    teamLeaderApprovedBy: apiApproval.team_leader_approved_by ?
      (typeof apiApproval.team_leader_approved_by === 'object' ? apiApproval.team_leader_approved_by.id : apiApproval.team_leader_approved_by as any) :
      undefined,
    ceoComment: apiApproval.ceo_comment || undefined,
    ceoApprovedAt: apiApproval.ceo_approved_at || undefined,
    ceoApprovedBy: apiApproval.ceo_approved_by ?
      (typeof apiApproval.ceo_approved_by === 'object' ? apiApproval.ceo_approved_by.id : apiApproval.ceo_approved_by as any) :
      undefined,
    rejectionReason: apiApproval.rejection_reason || undefined,
    nextTasks: apiApproval.next_tasks?.map(t => typeof t === 'object' ? t.id : t as any) || [],
    comments: apiApproval.comments?.map(c => ({
      id: c.id,
      content: c.content,
      createdBy: typeof c.created_by === 'object' ? c.created_by.id : c.created_by as any,
      createdAt: c.created_at,
    })) || [],
    createdBy: typeof apiApproval.created_by === 'object' ? apiApproval.created_by.id : apiApproval.created_by as any,
    createdAt: apiApproval.created_at,
  };

  console.log('Transform approval:', {
    id: apiApproval.id,
    status: apiApproval.status,
    teamLeaderApprovedBy: apiApproval.team_leader_approved_by,
    transformed_teamLeaderApprovedBy: transformed.teamLeaderApprovedBy,
  });

  return transformed;
}

/**
 * Transform API Report response to frontend Report type
 * Backend returns User objects and Task objects, frontend expects IDs
 */
function transformReportAPIResponse(apiReport: ReportAPIResponse): Report {
  return {
    id: apiReport.id,
    type: apiReport.type as any,
    weekNumber: apiReport.week_number || undefined,
    month: apiReport.month || undefined,
    year: apiReport.year,
    content: apiReport.content,
    tasks: apiReport.tasks?.map(t => typeof t === 'object' ? t.id : t as any) || [],
    createdBy: typeof apiReport.created_by === 'object' ? apiReport.created_by.id : apiReport.created_by as any,
    createdAt: apiReport.created_at,
  };
}

/**
 * Transform API Announcement response to frontend Announcement type
 * Backend returns snake_case with nested objects, frontend expects camelCase with IDs
 */
function transformAnnouncementAPIResponse(apiAnnouncement: AnnouncementAPIResponse): Announcement {
  return {
    id: apiAnnouncement.id,
    type: apiAnnouncement.type as any,
    title: apiAnnouncement.title,
    subtitle: apiAnnouncement.subtitle || undefined,
    content: apiAnnouncement.content || undefined,
    platform: apiAnnouncement.platform as any,
    deadline: apiAnnouncement.deadline,
    approvalId: apiAnnouncement.approval ?
      (typeof apiAnnouncement.approval === 'object' ? apiAnnouncement.approval.id : apiAnnouncement.approval as any) :
      undefined,
    version: apiAnnouncement.version || undefined,
    items: apiAnnouncement.items?.map(item => ({
      id: item.id,
      content: item.content,
      image: item.firebase_image_url || undefined,
    })) || undefined,
    createdBy: typeof apiAnnouncement.created_by === 'object' ? apiAnnouncement.created_by.id : apiAnnouncement.created_by as any,
    createdAt: apiAnnouncement.created_at,
  };
}

// ========================================
// Authentication
// ========================================

export async function login(name: string, password: string): Promise<User | null> {
  try {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login/',
      { name, password } as LoginRequest,
      true // skip auth
    );

    // Store tokens and user
    setTokens(response.access, response.refresh);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kingbus_current_user', JSON.stringify(response.user));
    }

    return response.user;
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('kingbus_refresh_token')
      : null;

    if (refreshToken) {
      await apiClient.post('/auth/logout/', { refresh: refreshToken });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('kingbus_current_user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function refreshCurrentUser(): Promise<User | null> {
  try {
    const user = await apiClient.get<User>('/auth/me/');
    if (typeof window !== 'undefined') {
      localStorage.setItem('kingbus_current_user', JSON.stringify(user));
    }
    return user;
  } catch (error) {
    console.error('Failed to refresh user:', error);
    return null;
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kingbus_current_user', JSON.stringify(user));
}

// ========================================
// Users
// ========================================

export async function getUsers(): Promise<User[]> {
  try {
    const response = await apiClient.get<{ results: User[] }>('/users/?limit=100');
    return response.results || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  try {
    await apiClient.patch(`/users/${userId}/role/`, { role } as UserRoleUpdateRequest);
    return true;
  } catch (error) {
    console.error('Failed to update user role:', error);
    return false;
  }
}

// ========================================
// Services
// ========================================

export async function getServices(): Promise<ServiceType[]> {
  try {
    const response = await apiClient.get<{ results: Array<{ name: string }> }>('/services/');
    return response.results.map(s => s.name as ServiceType);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return [];
  }
}

export async function addService(name: string): Promise<boolean> {
  try {
    await apiClient.post('/services/', { name });
    return true;
  } catch (error) {
    console.error('Failed to add service:', error);
    return false;
  }
}

export async function removeService(name: string): Promise<boolean> {
  try {
    await apiClient.delete(`/services/${encodeURIComponent(name)}/`);
    return true;
  } catch (error) {
    console.error('Failed to remove service:', error);
    return false;
  }
}

export async function saveServices(services: ServiceType[]): Promise<void> {
  // This function is deprecated - use addService/removeService instead
  console.warn('saveServices is deprecated - use addService/removeService');
}

// ========================================
// Tasks
// ========================================

export async function getTasks(filters?: TaskQueryParams): Promise<Task[]> {
  try {
    const params = { ...filters, limit: 100 };
    const response = await apiClient.get<{ results: TaskAPIResponse[] }>('/tasks/', params);
    const tasks = response.results || [];
    // Transform API response to frontend Task type
    return tasks.map(transformTaskAPIResponse);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return [];
  }
}

export async function getTask(taskId: string): Promise<Task | null> {
  try {
    console.log('getTask called with taskId:', taskId);
    const task = await apiClient.get<TaskAPIResponse>(`/tasks/${taskId}/`);
    console.log('getTask API response:', task);
    console.log('getTask API response files:', task.files);
    // Transform API response to frontend Task type
    const transformed = transformTaskAPIResponse(task);
    console.log('getTask transformed:', transformed);
    console.log('getTask transformed files:', transformed.files);
    return transformed;
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return null;
  }
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt' | 'createdBy'>): Promise<Task | null> {
  try {
    const requestData: TaskCreateRequest = {
      title: task.title,
      category: task.category,
      service: task.service,
      start_date: task.startDate || null,
      due_date: task.dueDate || null,
      content: task.content,
      status: task.status,
      assignee_ids: task.assignees || [],
      cc_ids: task.cc || [],
      related_task_ids: task.relatedTasks || [],
    };

    console.log('Creating task with data:', requestData);
    const newTask = await apiClient.post<TaskAPIResponse>('/tasks/', requestData);
    console.log('Task created successfully (raw API response):', newTask);
    const transformed = transformTaskAPIResponse(newTask);
    console.log('Transformed task:', transformed);
    console.log('Transformed task ID:', transformed.id);
    return transformed;
  } catch (error) {
    console.error('Failed to add task:', error);
    return null;
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
  try {
    const requestData: TaskUpdateRequest = {
      title: updates.title,
      category: updates.category,
      service: updates.service,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      content: updates.content,
      status: updates.status,
      assignee_ids: updates.assignees,
      cc_ids: updates.cc,
      related_task_ids: updates.relatedTasks,
    };

    // Remove undefined fields
    Object.keys(requestData).forEach(key => {
      if (requestData[key as keyof TaskUpdateRequest] === undefined) {
        delete requestData[key as keyof TaskUpdateRequest];
      }
    });

    const updatedTask = await apiClient.patch<TaskAPIResponse>(`/tasks/${taskId}/`, requestData);
    return transformTaskAPIResponse(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    return null;
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/tasks/${taskId}/`);
    return true;
  } catch (error) {
    console.error('Failed to delete task:', error);
    return false;
  }
}

export async function addTaskComment(taskId: string, content: string): Promise<boolean> {
  try {
    await apiClient.post(`/tasks/${taskId}/comments/`, { content });
    return true;
  } catch (error) {
    console.error('Failed to add comment:', error);
    return false;
  }
}

export async function uploadTaskFile(
  taskId: string,
  file: File,
  name: string,
  type: string
): Promise<boolean> {
  try {
    console.log('uploadTaskFile called with:', { taskId, fileName: file.name, name, type });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('type', type);

    const result = await apiClient.upload(`/tasks/${taskId}/files/`, formData);
    console.log('uploadTaskFile result:', result);
    return true;
  } catch (error) {
    console.error('Failed to upload file:', error);
    return false;
  }
}

export async function deleteTaskFile(taskId: string, fileId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/tasks/${taskId}/files/${fileId}/`);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

// Legacy function - kept for compatibility
export function saveTasks(tasks: Task[]): void {
  // This function is deprecated - tasks are auto-saved via API
  console.warn('saveTasks is deprecated - tasks are auto-saved via API');
}

// ========================================
// Approvals
// ========================================

export async function getApprovals(): Promise<Approval[]> {
  try {
    const response = await apiClient.get<{ results: ApprovalAPIResponse[] }>('/approvals/?limit=100');
    const approvals = response.results || [];
    // Transform API response to frontend Approval type
    return approvals.map(transformApprovalAPIResponse);
  } catch (error) {
    console.error('Failed to fetch approvals:', error);
    return [];
  }
}

export async function getApproval(approvalId: string): Promise<Approval | null> {
  try {
    const approval = await apiClient.get<ApprovalAPIResponse>(`/approvals/${approvalId}/`);
    // Transform API response to frontend Approval type
    return transformApprovalAPIResponse(approval);
  } catch (error) {
    console.error('Failed to fetch approval:', error);
    return null;
  }
}

export async function addApproval(
  approval: Omit<Approval, 'id' | 'createdAt' | 'createdBy' | 'status' | 'comments'>
): Promise<Approval | null> {
  try {
    const requestData: ApprovalCreateRequest = {
      task_id: approval.taskId,
      summary: approval.summary,
      links: approval.links,
      next_task_ids: approval.nextTasks || [],
    };

    console.log('Creating approval with data:', requestData);
    const newApproval = await apiClient.post<ApprovalAPIResponse>('/approvals/', requestData);
    console.log('Approval created successfully:', newApproval);
    return transformApprovalAPIResponse(newApproval);
  } catch (error) {
    console.error('Failed to add approval:', error);
    return null;
  }
}

export async function updateApproval(
  approvalId: string,
  updates: Partial<Approval>
): Promise<Approval | null> {
  try {
    const requestData: ApprovalUpdateRequest = {
      summary: updates.summary,
      links: updates.links,
      next_task_ids: updates.nextTasks,
    };

    // Remove undefined fields
    Object.keys(requestData).forEach(key => {
      if (requestData[key as keyof ApprovalUpdateRequest] === undefined) {
        delete requestData[key as keyof ApprovalUpdateRequest];
      }
    });

    const updatedApproval = await apiClient.patch<ApprovalAPIResponse>(`/approvals/${approvalId}/`, requestData);
    return transformApprovalAPIResponse(updatedApproval);
  } catch (error) {
    console.error('Failed to update approval:', error);
    return null;
  }
}

export async function deleteApproval(approvalId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/approvals/${approvalId}/`);
    return true;
  } catch (error) {
    console.error('Failed to delete approval:', error);
    return false;
  }
}

export async function teamLeaderApprove(
  approvalId: string,
  approved: boolean,
  comment?: string,
  rejectionReason?: string
): Promise<Approval | null> {
  try {
    const result = await apiClient.post<ApprovalAPIResponse>(`/approvals/${approvalId}/team-leader-approve/`, {
      approved,
      comment,
      rejection_reason: rejectionReason,
    });
    return transformApprovalAPIResponse(result);
  } catch (error) {
    console.error('Failed to approve as team leader:', error);
    return null;
  }
}

export async function ceoApprove(
  approvalId: string,
  approved: boolean,
  comment?: string,
  rejectionReason?: string
): Promise<Approval | null> {
  try {
    const result = await apiClient.post<ApprovalAPIResponse>(`/approvals/${approvalId}/ceo-approve/`, {
      approved,
      comment,
      rejection_reason: rejectionReason,
    });
    return transformApprovalAPIResponse(result);
  } catch (error) {
    console.error('Failed to approve as CEO:', error);
    return null;
  }
}

export async function addApprovalComment(approvalId: string, content: string): Promise<boolean> {
  try {
    await apiClient.post(`/approvals/${approvalId}/comments/`, { content });
    return true;
  } catch (error) {
    console.error('Failed to add approval comment:', error);
    return false;
  }
}

// Legacy function
export function saveApprovals(approvals: Approval[]): void {
  console.warn('saveApprovals is deprecated - approvals are auto-saved via API');
}

// ========================================
// Reports
// ========================================

export async function getReports(): Promise<Report[]> {
  try {
    const response = await apiClient.get<{ results: ReportAPIResponse[] }>('/reports/?limit=100');
    const reports = response.results || [];
    // Transform API response to frontend Report type
    return reports.map(transformReportAPIResponse);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }
}

export async function getReport(reportId: string): Promise<Report | null> {
  try {
    const report = await apiClient.get<ReportAPIResponse>(`/reports/${reportId}/`);
    return transformReportAPIResponse(report);
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return null;
  }
}

export async function addReport(
  report: Omit<Report, 'id' | 'createdAt' | 'createdBy'>
): Promise<Report | null> {
  try {
    const requestData: ReportCreateRequest = {
      type: report.type,
      week_number: report.weekNumber,
      month: report.month,
      year: report.year,
      content: report.content,
      task_ids: report.tasks || [],
    };

    const newReport = await apiClient.post<ReportAPIResponse>('/reports/', requestData);
    return transformReportAPIResponse(newReport);
  } catch (error) {
    console.error('Failed to add report:', error);
    return null;
  }
}

export async function updateReport(
  reportId: string,
  updates: Partial<Report>
): Promise<Report | null> {
  try {
    const requestData: ReportUpdateRequest = {
      type: updates.type,
      week_number: updates.weekNumber,
      month: updates.month,
      year: updates.year,
      content: updates.content,
      task_ids: updates.tasks,
    };

    // Remove undefined fields
    Object.keys(requestData).forEach(key => {
      if (requestData[key as keyof ReportUpdateRequest] === undefined) {
        delete requestData[key as keyof ReportUpdateRequest];
      }
    });

    const updatedReport = await apiClient.patch<ReportAPIResponse>(`/reports/${reportId}/`, requestData);
    return transformReportAPIResponse(updatedReport);
  } catch (error) {
    console.error('Failed to update report:', error);
    return null;
  }
}

export async function deleteReport(reportId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/reports/${reportId}/`);
    return true;
  } catch (error) {
    console.error('Failed to delete report:', error);
    return false;
  }
}

// Legacy function
export function saveReports(reports: Report[]): void {
  console.warn('saveReports is deprecated - reports are auto-saved via API');
}

// ========================================
// Announcements
// ========================================

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const response = await apiClient.get<{ results: AnnouncementAPIResponse[] }>('/announcements/?limit=100');
    const announcements = response.results || [];
    // Transform API response to frontend Announcement type
    return announcements.map(transformAnnouncementAPIResponse);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [];
  }
}

export async function getAnnouncement(announcementId: string): Promise<Announcement | null> {
  try {
    const announcement = await apiClient.get<AnnouncementAPIResponse>(`/announcements/${announcementId}/`);
    // Transform API response to frontend Announcement type
    return transformAnnouncementAPIResponse(announcement);
  } catch (error) {
    console.error('Failed to fetch announcement:', error);
    return null;
  }
}

export async function addPatchNote(
  patchNote: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'type'>
): Promise<Announcement | null> {
  try {
    const requestData: PatchNoteCreateRequest = {
      title: patchNote.title,
      subtitle: patchNote.subtitle,
      platform: patchNote.platform,
      deadline: patchNote.deadline,
      approval_id: patchNote.approvalId,
      version: patchNote.version || '',
      items: patchNote.items?.map(item => ({
        content: item.content,
      })),
    };

    const newPatchNote = await apiClient.post<AnnouncementAPIResponse>('/announcements/patch-notes/', requestData);
    return transformAnnouncementAPIResponse(newPatchNote);
  } catch (error) {
    console.error('Failed to add patch note:', error);
    return null;
  }
}

export async function addUrgentAnnouncement(
  announcement: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'type'>
): Promise<Announcement | null> {
  try {
    const requestData: UrgentAnnouncementCreateRequest = {
      title: announcement.title,
      subtitle: announcement.subtitle,
      content: announcement.content || '',
      platform: announcement.platform,
      deadline: announcement.deadline,
    };

    const newAnnouncement = await apiClient.post<AnnouncementAPIResponse>('/announcements/urgent/', requestData);
    return transformAnnouncementAPIResponse(newAnnouncement);
  } catch (error) {
    console.error('Failed to add urgent announcement:', error);
    return null;
  }
}

export async function addAnnouncement(
  announcement: Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>
): Promise<Announcement | null> {
  // Route to appropriate function based on type
  if (announcement.type === 'patch') {
    return addPatchNote(announcement);
  } else {
    return addUrgentAnnouncement(announcement);
  }
}

export async function updateAnnouncement(
  announcementId: string,
  updates: Partial<Announcement>
): Promise<Announcement | null> {
  try {
    const requestData: any = {
      title: updates.title,
      subtitle: updates.subtitle,
      content: updates.content,
      platform: updates.platform,
      deadline: updates.deadline,
      approval_id: updates.approvalId,
      version: updates.version,
    };

    // Remove undefined fields
    Object.keys(requestData).forEach(key => {
      if (requestData[key] === undefined) {
        delete requestData[key];
      }
    });

    const updatedAnnouncement = await apiClient.patch<AnnouncementAPIResponse>(
      `/announcements/${announcementId}/`,
      requestData
    );
    return transformAnnouncementAPIResponse(updatedAnnouncement);
  } catch (error) {
    console.error('Failed to update announcement:', error);
    return null;
  }
}

export async function deleteAnnouncement(announcementId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/announcements/${announcementId}/`);
    return true;
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    return false;
  }
}

// Legacy functions
export function saveAnnouncements(announcements: Announcement[]): void {
  console.warn('saveAnnouncements is deprecated - announcements are auto-saved via API');
}

export function getPatchNotes(): Announcement[] {
  console.warn('getPatchNotes is deprecated - use getAnnouncements with filter');
  return [];
}

export function savePatchNotes(patchNotes: Announcement[]): void {
  console.warn('savePatchNotes is deprecated - use addPatchNote');
}

// ========================================
// Statistics
// ========================================

export async function getDashboardStatistics(): Promise<any> {
  try {
    return await apiClient.get('/statistics/dashboard/');
  } catch (error) {
    console.error('Failed to fetch dashboard statistics:', error);
    return null;
  }
}

export async function getUserTaskStatistics(userId: string): Promise<any> {
  try {
    return await apiClient.get(`/statistics/users/${userId}/tasks/`);
  } catch (error) {
    console.error('Failed to fetch user task statistics:', error);
    return null;
  }
}

// ========================================
// Initialize - No longer needed
// ========================================

export function initializeStorage(): void {
  // No initialization needed for API-based storage
  // Just check if user is logged in
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (!token) {
      const currentUser = getCurrentUser();
      if (!currentUser && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  }
}
