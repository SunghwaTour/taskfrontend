'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, ClipboardList, FileText, CheckSquare, AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TaskDetailModal } from '@/components/task-detail-modal'
import { ApprovalDetailModal } from '@/components/approval-detail-modal'
import { ReportDetailModal } from '@/components/report-detail-modal'
import {
  getCurrentUser,
  getTasks,
  getApprovals,
  getReports,
  getUsers,
} from '@/lib/storage'
import { Task, Approval, Report, User as UserType } from '@/lib/types'

export default function MyPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [ccTasks, setCCTasks] = useState<Task[]>([])
  const [myReports, setMyReports] = useState<Report[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])

  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/')
      return
    }
    setCurrentUser(user)
  }, [router])

  useEffect(() => {
    if (!currentUser) return

    const loadData = async () => {
      const [tasksList, allApprovals, allReports, usersList] = await Promise.all([
        getTasks(),
        getApprovals(),
        getReports(),
        getUsers(),
      ])

      setAllTasks(tasksList)
      setUsers(usersList)

      const createdTasks = tasksList.filter((task) => task.createdBy === currentUser.id)
      setMyTasks(createdTasks)

      const ccedTasks = tasksList.filter((task) => task.cc.includes(currentUser.id))
      setCCTasks(ccedTasks)

      const userReports = allReports.filter((report) => report.createdBy === currentUser.id)
      setMyReports(userReports)

      if (['CEO', 'TEAM_LEADER'].includes(currentUser.role)) {
        const pending = allApprovals.filter((approval) => {
          if (approval.status !== 'PENDING') return false

          if (currentUser.role === 'TEAM_LEADER' && !approval.teamLeaderApprovedBy) {
            return true
          }

          if (
            currentUser.role === 'CEO' &&
            approval.teamLeaderApprovedBy &&
            !approval.ceoApprovedBy
          ) {
            return true
          }

          return false
        })
        setPendingApprovals(pending)
      }
    }

    loadData()
  }, [currentUser])

  const refreshData = async () => {
    if (!currentUser) return

    const [tasksList, allApprovals, allReports, usersList] = await Promise.all([
      getTasks(),
      getApprovals(),
      getReports(),
      getUsers(),
    ])

    setAllTasks(tasksList)
    setUsers(usersList)

    const createdTasks = tasksList.filter((task) => task.createdBy === currentUser.id)
    setMyTasks(createdTasks)

    const ccedTasks = tasksList.filter((task) => task.cc.includes(currentUser.id))
    setCCTasks(ccedTasks)

    const userReports = allReports.filter((report) => report.createdBy === currentUser.id)
    setMyReports(userReports)

    if (['CEO', 'TEAM_LEADER'].includes(currentUser.role)) {
      const pending = allApprovals.filter((approval) => {
        if (approval.status !== 'PENDING') return false

        if (currentUser.role === 'TEAM_LEADER' && !approval.teamLeaderApprovedBy) {
          return true
        }

        if (
          currentUser.role === 'CEO' &&
          approval.teamLeaderApprovedBy &&
          !approval.ceoApprovedBy
        ) {
          return true
        }

        return false
      })
      setPendingApprovals(pending)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setTaskModalOpen(true)
  }

  const handleApprovalClick = (approval: Approval) => {
    setSelectedApproval(approval)
    setApprovalModalOpen(true)
  }

  const handleReportClick = (report: Report) => {
    setSelectedReport(report)
    setReportModalOpen(true)
  }

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || '알 수 없음'
  }

  const getTaskTitle = (taskId: string) => {
    if (!Array.isArray(allTasks)) return '알 수 없음'
    return allTasks.find((t) => t.id === taskId)?.title || '알 수 없음'
  }

  const statusLabels = {
    BACKLOG: '백로그',
    TODO: '계획',
    DOING: '진행중',
    DONE: '완료',
  }

  const roleLabels = {
    CEO: '대표',
    TEAM_LEADER: '팀장',
    MEMBER: '팀원',
    VISITOR: '방문자',
  }

  const roleBadgeColors = {
    CEO: 'bg-red-500',
    TEAM_LEADER: 'bg-blue-500',
    MEMBER: 'bg-gray-500',
    VISITOR: 'bg-yellow-500',
  }

  if (!currentUser) return null

  const taskStats = {
    total: myTasks.length,
    backlog: myTasks.filter((t) => t.status === 'BACKLOG').length,
    todo: myTasks.filter((t) => t.status === 'TODO').length,
    doing: myTasks.filter((t) => t.status === 'DOING').length,
    done: myTasks.filter((t) => t.status === 'DONE').length,
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="mt-1 text-sm text-muted-foreground">내 활동 내역과 통계를 확인하세요</p>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{currentUser.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={roleBadgeColors[currentUser.role]}>
                {roleLabels[currentUser.role]}
              </Badge>
              {['CEO', 'TEAM_LEADER'].includes(currentUser.role) && (
                <Badge variant="outline">결재 권한</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">작성한 업무</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              진행중 {taskStats.doing}건 · 완료 {taskStats.done}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">참조된 업무</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ccTasks.length}</div>
            <p className="text-xs text-muted-foreground">내가 참조된 업무</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">작성한 보고서</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myReports.length}</div>
            <p className="text-xs text-muted-foreground">주간/월간 보고서</p>
          </CardContent>
        </Card>

        {['CEO', 'TEAM_LEADER'].includes(currentUser.role) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대기 중 결재</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApprovals.length}</div>
              <p className="text-xs text-muted-foreground">결재가 필요합니다</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Approvals Alert */}
      {['CEO', 'TEAM_LEADER'].includes(currentUser.role) && pendingApprovals.length > 0 && (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              결재 대기 중인 업무가 있습니다
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovals.slice(0, 3).map((approval) => (
                <div
                  key={approval.id}
                  className="flex cursor-pointer items-center justify-between rounded-md bg-card p-3 transition-colors hover:bg-accent"
                  onClick={() => handleApprovalClick(approval)}
                >
                  <span className="font-medium text-sm">
                    {approval.taskTitle || getTaskTitle(approval.taskId)}
                  </span>
                  <Badge variant="secondary">결재 필요</Badge>
                </div>
              ))}
              {pendingApprovals.length > 3 && (
                <p className="text-center text-sm text-muted-foreground">
                  +{pendingApprovals.length - 3}건 더보기
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different content */}
      <Tabs defaultValue="myTasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="myTasks">
            작성한 업무 <Badge variant="secondary" className="ml-2">{myTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ccTasks">
            참조된 업무 <Badge variant="secondary" className="ml-2">{ccTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports">
            작성한 보고서 <Badge variant="secondary" className="ml-2">{myReports.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="myTasks">
          <Card>
            <CardHeader>
              <CardTitle>작성한 업무</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>서비스</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>마감일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTasks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          작성한 업무가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      myTasks.map((task) => (
                        <TableRow
                          key={task.id}
                          className="cursor-pointer"
                          onClick={() => handleTaskClick(task)}
                        >
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{task.service}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>{statusLabels[task.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{task.dueDate || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ccTasks">
          <Card>
            <CardHeader>
              <CardTitle>참조된 업무</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>서비스</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>작성자</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ccTasks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          참조된 업무가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ccTasks.map((task) => (
                        <TableRow
                          key={task.id}
                          className="cursor-pointer"
                          onClick={() => handleTaskClick(task)}
                        >
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{task.service}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>{statusLabels[task.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {getUserName(task.createdBy)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>작성한 보고서</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>유형</TableHead>
                      <TableHead>기간</TableHead>
                      <TableHead>관련 업무</TableHead>
                      <TableHead>작성일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myReports.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          작성한 보고서가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      myReports.map((report) => (
                        <TableRow
                          key={report.id}
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleReportClick(report)}
                        >
                          <TableCell>
                            <Badge variant={report.type === 'WEEKLY' ? 'default' : 'secondary'}>
                              {report.type === 'WEEKLY' ? '주간' : '월간'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {report.type === 'WEEKLY' && report.weekNumber
                              ? `${report.year}년 ${report.weekNumber}주차`
                              : `${report.year}년 ${report.month}월`}
                          </TableCell>
                          <TableCell className="text-sm">
                            {report.tasks.length}건
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TaskDetailModal
        task={selectedTask}
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onTaskUpdated={refreshData}
      />

      <ApprovalDetailModal
        approval={selectedApproval}
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        onApprovalUpdated={refreshData}
      />

      <ReportDetailModal
        report={selectedReport}
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onReportUpdated={refreshData}
      />
    </div>
  )
}
