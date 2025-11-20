'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Calendar, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportCreateModal } from '@/components/report-create-modal'
import { ReportDetailModal } from '@/components/report-detail-modal'
import { getReports, getUsers, getCurrentUser } from '@/lib/storage'
import { Report, ReportType, User } from '@/lib/types'
import { formatWeekLabel } from '@/lib/utils/date'

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<'all' | ReportType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const loadData = async () => {
    const user = getCurrentUser()
    const usersList = await getUsers()
    const allReports = await getReports()

    setCurrentUser(user)
    setUsers(Array.isArray(usersList) ? usersList : [])

    const reportsList = Array.isArray(allReports) ? allReports : []
    const visibleReports = user && (user.role === 'TEAM_LEADER' || user.role === 'CEO')
      ? reportsList
      : reportsList.filter(report => report.createdBy === user?.id) // MEMBER and VISITOR only see their own

    // Sort by creation date, newest first
    const sortedReports = visibleReports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setReports(sortedReports)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredReports = reports.filter((report) => {
    // Filter by type
    if (filter !== 'all' && report.type !== filter) return false

    // Filter by search query
    if (searchQuery) {
      const periodLabel = getPeriodLabel(report).toLowerCase()
      const content = report.content.toLowerCase()
      const creator = getUserName(report.createdBy).toLowerCase()
      const query = searchQuery.toLowerCase()

      return periodLabel.includes(query) || content.includes(query) || creator.includes(query)
    }

    return true
  })

  const handleReportClick = (report: Report) => {
    setSelectedReport(report)
    setDetailModalOpen(true)
  }

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || '알 수 없음'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getPeriodLabel = (report: Report) => {
    if (report.type === 'WEEKLY' && report.weekNumber) {
      return formatWeekLabel(parseInt(report.year), parseInt(report.weekNumber))
    } else if (report.type === 'MONTHLY' && report.month) {
      return `${report.year}년 ${report.month}월`
    }
    return ''
  }

  const weeklyCount = reports.filter((r) => r.type === 'WEEKLY').length
  const monthlyCount = reports.filter((r) => r.type === 'MONTHLY').length

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">보고서</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentUser && (currentUser.role === 'TEAM_LEADER' || currentUser.role === 'CEO')
              ? '주간 및 월간 업무 보고서를 작성하고 관리하세요'
              : '본인의 주간 및 월간 업무 보고서를 작성하고 관리하세요'}
          </p>
        </div>
        {currentUser?.role !== 'VISITOR' && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            보고서 작성
          </Button>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="기간, 내용, 작성자로 검색..."
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
              전체 <Badge variant="secondary" className="ml-2">{reports.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="WEEKLY">
              주간 <Badge variant="secondary" className="ml-2">{weeklyCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="MONTHLY">
              월간 <Badge variant="secondary" className="ml-2">{monthlyCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {searchQuery ? '검색 결과가 없습니다.' : '작성된 보고서가 없습니다.'}
          </div>
        ) : (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleReportClick(report)}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between">
                  <Badge variant={report.type === 'WEEKLY' ? 'default' : 'secondary'}>
                    {report.type === 'WEEKLY' ? '주간' : '월간'}
                  </Badge>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>

                <h3 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                  <Calendar className="h-4 w-4" />
                  {getPeriodLabel(report)}
                </h3>

                <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                  {report.content}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>작성자: {getUserName(report.createdBy)}</span>
                  <span>{formatDate(report.createdAt)}</span>
                </div>

                {report.tasks && report.tasks.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    관련 업무 {report.tasks.length}건
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ReportCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onReportCreated={loadData}
      />

      <ReportDetailModal
        report={selectedReport}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onReportUpdated={loadData}
      />
    </div>
  )
}
