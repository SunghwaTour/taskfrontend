import { User, Task, Approval, Report, PatchNote, ServiceType, Announcement } from './types'

// Initialize default users
const defaultUsers: User[] = [
  { id: '1', name: '이주성', password: '0000', role: 'TEAM_LEADER' },
  { id: '2', name: '김형주', password: '0000', role: 'CEO' },
  { id: '3', name: '최시온', password: '0000', role: 'TEAM_LEADER' },
  { id: '4', name: '신태환', password: '0000', role: 'MEMBER' },
  { id: '5', name: '김예나', password: '0000', role: 'MEMBER' },
  { id: '6', name: '오준희', password: '0000', role: 'MEMBER' },
]

const defaultServices: ServiceType[] = [
  'TRP',
  'RPA-D',
  'Kingbus',
  'Link',
  'Link-M',
  'Link-TRP',
  'Link-D',
  '기타',
]

// Storage keys
const KEYS = {
  USERS: 'kingbus_users',
  CURRENT_USER: 'kingbus_current_user',
  TASKS: 'kingbus_tasks',
  APPROVALS: 'kingbus_approvals',
  REPORTS: 'kingbus_reports',
  PATCH_NOTES: 'kingbus_patch_notes',
  ANNOUNCEMENTS: 'kingbus_announcements',
  SERVICES: 'kingbus_services',
}

// Initialize storage
export const initializeStorage = () => {
  if (typeof window === 'undefined') return

  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers))
  }
  if (!localStorage.getItem(KEYS.TASKS)) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify([]))
  }
  if (!localStorage.getItem(KEYS.APPROVALS)) {
    localStorage.setItem(KEYS.APPROVALS, JSON.stringify([]))
  }
  if (!localStorage.getItem(KEYS.REPORTS)) {
    localStorage.setItem(KEYS.REPORTS, JSON.stringify([]))
  }
  if (!localStorage.getItem(KEYS.PATCH_NOTES)) {
    localStorage.setItem(KEYS.PATCH_NOTES, JSON.stringify([]))
  }
  if (!localStorage.getItem(KEYS.ANNOUNCEMENTS)) {
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify([]))
  }
  if (!localStorage.getItem(KEYS.SERVICES)) {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(defaultServices))
  }
}

// User storage functions
export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return []
  const users = localStorage.getItem(KEYS.USERS)
  return users ? JSON.parse(users) : []
}

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem(KEYS.CURRENT_USER)
  return user ? JSON.parse(user) : null
}

export const setCurrentUser = (user: User | null) => {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user))
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER)
  }
}

export const login = (name: string, password: string): User | null => {
  const users = getUsers()
  const user = users.find((u) => u.name === name && u.password === password)
  if (user) {
    setCurrentUser(user)
    return user
  }
  return null
}

export const logout = () => {
  setCurrentUser(null)
}

export const updateUserRole = (userId: string, role: User['role']) => {
  const users = getUsers()
  const updatedUsers = users.map((u) => (u.id === userId ? { ...u, role } : u))
  localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers))
}

// Task storage functions
export const getTasks = (): Task[] => {
  if (typeof window === 'undefined') return []
  const tasks = localStorage.getItem(KEYS.TASKS)
  return tasks ? JSON.parse(tasks) : []
}

export const saveTasks = (tasks: Task[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('taskUpdated'))
  }
}

export const addTask = (task: Task) => {
  const tasks = getTasks()
  tasks.push(task)
  saveTasks(tasks)
}

export const updateTask = (taskId: string, updates: Partial<Task>) => {
  const tasks = getTasks()
  const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
  saveTasks(updatedTasks)
}

export const deleteTask = (taskId: string) => {
  const tasks = getTasks()
  const filteredTasks = tasks.filter((t) => t.id !== taskId)
  saveTasks(filteredTasks)
}

// Approval storage functions
export const getApprovals = (): Approval[] => {
  if (typeof window === 'undefined') return []
  const approvals = localStorage.getItem(KEYS.APPROVALS)
  return approvals ? JSON.parse(approvals) : []
}

export const saveApprovals = (approvals: Approval[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.APPROVALS, JSON.stringify(approvals))
}

export const addApproval = (approval: Approval) => {
  const approvals = getApprovals()
  approvals.push(approval)
  saveApprovals(approvals)
}

export const updateApproval = (approvalId: string, updates: Partial<Approval>) => {
  const approvals = getApprovals()
  const updatedApprovals = approvals.map((a) =>
    a.id === approvalId ? { ...a, ...updates } : a
  )
  saveApprovals(updatedApprovals)
}

export const deleteApproval = (approvalId: string) => {
  const approvals = getApprovals()
  const filteredApprovals = approvals.filter((a) => a.id !== approvalId)
  saveApprovals(filteredApprovals)
}

// Report storage functions
export const getReports = (): Report[] => {
  if (typeof window === 'undefined') return []
  const reports = localStorage.getItem(KEYS.REPORTS)
  return reports ? JSON.parse(reports) : []
}

export const saveReports = (reports: Report[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports))
}

export const addReport = (report: Report) => {
  const reports = getReports()
  reports.push(report)
  saveReports(reports)
}

export const updateReport = (reportId: string, updates: Partial<Report>) => {
  const reports = getReports()
  const updatedReports = reports.map((r) =>
    r.id === reportId ? { ...r, ...updates } : r
  )
  saveReports(updatedReports)
}

export const deleteReport = (reportId: string) => {
  const reports = getReports()
  const filteredReports = reports.filter((r) => r.id !== reportId)
  saveReports(filteredReports)
}

// Patch Note storage functions
export const getPatchNotes = (): PatchNote[] => {
  if (typeof window === 'undefined') return []
  const patchNotes = localStorage.getItem(KEYS.PATCH_NOTES)
  return patchNotes ? JSON.parse(patchNotes) : []
}

export const savePatchNotes = (patchNotes: PatchNote[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.PATCH_NOTES, JSON.stringify(patchNotes))
}

export const addPatchNote = (patchNote: PatchNote) => {
  const patchNotes = getPatchNotes()
  patchNotes.push(patchNote)
  savePatchNotes(patchNotes)
}

export const updatePatchNote = (patchNoteId: string, updates: Partial<PatchNote>) => {
  const patchNotes = getPatchNotes()
  const updatedPatchNotes = patchNotes.map((p) =>
    p.id === patchNoteId ? { ...p, ...updates } : p
  )
  savePatchNotes(updatedPatchNotes)
}

export const deletePatchNote = (patchNoteId: string) => {
  const patchNotes = getPatchNotes()
  const filteredPatchNotes = patchNotes.filter((p) => p.id !== patchNoteId)
  savePatchNotes(filteredPatchNotes)
}

// Announcement storage functions
export const getAnnouncements = (): Announcement[] => {
  if (typeof window === 'undefined') return []
  const announcements = localStorage.getItem(KEYS.ANNOUNCEMENTS)
  return announcements ? JSON.parse(announcements) : []
}

export const saveAnnouncements = (announcements: Announcement[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(announcements))
}

export const addAnnouncement = (announcement: Announcement) => {
  const announcements = getAnnouncements()
  announcements.push(announcement)
  saveAnnouncements(announcements)
}

export const updateAnnouncement = (announcementId: string, updates: Partial<Announcement>) => {
  const announcements = getAnnouncements()
  const updatedAnnouncements = announcements.map((a) =>
    a.id === announcementId ? { ...a, ...updates } : a
  )
  saveAnnouncements(updatedAnnouncements)
}

export const deleteAnnouncement = (announcementId: string) => {
  const announcements = getAnnouncements()
  const filteredAnnouncements = announcements.filter((a) => a.id !== announcementId)
  saveAnnouncements(filteredAnnouncements)
}

// Service storage functions
export const getServices = (): ServiceType[] => {
  if (typeof window === 'undefined') return []
  const services = localStorage.getItem(KEYS.SERVICES)
  return services ? JSON.parse(services) : defaultServices
}

export const saveServices = (services: ServiceType[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.SERVICES, JSON.stringify(services))
}

export const addService = (service: ServiceType) => {
  const services = getServices()
  if (!services.includes(service)) {
    services.push(service)
    saveServices(services)
  }
}

export const removeService = (service: ServiceType) => {
  const services = getServices()
  const filteredServices = services.filter((s) => s !== service)
  saveServices(filteredServices)
}
