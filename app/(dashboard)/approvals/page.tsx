'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Search, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ApprovalDetailModal } from '@/components/approval-detail-modal'
import { TaskDetailModal } from '@/components/task-detail-modal'
import { getApprovals, getTasks, getUsers, getCurrentUser } from '@/lib/storage'
import { Approval, Task, User } from '@/lib/types'

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [navigationTaskId, setNavigationTaskId] = useState<string | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const loadData = async () => {
    console.log('Loading approval data...')
    const user = getCurrentUser()
    const tasksList = await getTasks()
    const usersList = await getUsers()
    const allApprovals = await getApprovals()

    console.log('Loaded approvals:', allApprovals)

    setCurrentUser(user)
    setTasks(Array.isArray(tasksList) ? tasksList : [])
    setUsers(Array.isArray(usersList) ? usersList : [])

    // Filter approvals based on user role
    if (user?.role === 'MEMBER' || user?.role === 'VISITOR') {
      // Team members and visitors only see their own approvals
      const userApprovals = Array.isArray(allApprovals)
        ? allApprovals.filter((a) => a.createdBy === user.id)
        : []
      setApprovals(userApprovals)
    } else {
      // Team leaders and CEO can see all approvals
      setApprovals(Array.isArray(allApprovals) ? allApprovals : [])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredApprovals = approvals.filter((approval) => {
    // Filter by status
    if (filter === 'pending' && approval.status !== 'PENDING') return false
    if (filter === 'approved' && approval.status !== 'APPROVED') return false
    if (filter === 'rejected' && approval.status !== 'REJECTED') return false

    // Filter by search query
    if (searchQuery) {
      const task = tasks.find((t) => t.id === approval.taskId)
      const taskTitle = task?.title.toLowerCase() || ''
      const summary = approval.summary.toLowerCase()
      const creator = getUserName(approval.createdBy).toLowerCase()
      const query = searchQuery.toLowerCase()

      return taskTitle.includes(query) || summary.includes(query) || creator.includes(query)
    }

    return true
  })

  const handleApprovalClick = (approval: Approval) => {
    setSelectedApproval(approval)
    setDetailModalOpen(true)
  }

  const handleTaskNavigation = (taskId: string) => {
    setNavigationTaskId(taskId)
    setTaskModalOpen(true)
  }

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || '알 수 없음'
  }

  const getTaskTitle = (taskId: string) => {
    return tasks.find((t) => t.id === taskId)?.title || '알 수 없음'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const statusLabels = {
    PENDING: '대기',
    APPROVED: '승인',
    REJECTED: '반려',
  }

  const statusIcons = {
    PENDING: <Clock className="h-4 w-4" />,
    APPROVED: <CheckCircle className="h-4 w-4" />,
    REJECTED: <XCircle className="h-4 w-4" />,
  }

  const statusColors = {
    PENDING: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
  }

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length
  const rejectedCount = approvals.filter((a) => a.status === 'REJECTED').length

  const navigationTask = navigationTaskId ? tasks.find((t) => t.id === navigationTaskId) || null : null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">결재</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentUser?.role === 'MEMBER' 
            ? '본인이 요청한 결재를 확인하세요' 
            : '업무 완료 후 결재를 진행하세요'
          }
        </p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="업무 제목, 요약 내용, 작성자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">
              전체 <Badge variant="secondary" className="ml-2">{approvals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              대기 <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              승인 <Badge variant="secondary" className="ml-2">{approvedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              반려 <Badge variant="secondary" className="ml-2">{rejectedCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredApprovals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {searchQuery ? '검색 결과가 없습니다.' : filter === 'all' ? '결재 요청이 없습니다.' : `${statusLabels[filter.toUpperCase() as keyof typeof statusLabels]} 상태의 결재가 없습니다.`}
          </div>
        ) : (
          filteredApprovals.map((approval) => (
            <Card
              key={approval.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleApprovalClick(approval)}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between">
                  <Badge className={statusColors[approval.status]}>
                    {statusLabels[approval.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(approval.createdAt)}
                  </span>
                </div>

                <h3 className="mb-2 font-semibold text-sm leading-tight">
                  {getTaskTitle(approval.taskId)}
                </h3>

                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {approval.summary}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>요청자: {getUserName(approval.createdBy)}</span>
                  {approval.comments && approval.comments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {approval.comments.length}
                    </span>
                  )}
                </div>

                {/* Approval Progress */}
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <div
                    className={`flex items-center gap-1 ${
                      approval.teamLeaderApprovedBy
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {approval.teamLeaderApprovedBy ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    <span>팀장</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div
                    className={`flex items-center gap-1 ${
                      approval.ceoApprovedBy ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    {approval.ceoApprovedBy ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    <span>대표</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ApprovalDetailModal
        approval={selectedApproval}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onApprovalUpdated={loadData}
        onTaskClick={handleTaskNavigation}
      />

      <TaskDetailModal
        task={navigationTask}
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onTaskUpdated={loadData}
        onTaskClick={handleTaskNavigation}
      />
    </div>
  )
}
