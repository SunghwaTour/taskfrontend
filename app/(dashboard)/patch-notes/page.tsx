'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnnouncementCreateModal } from '@/components/announcement-create-modal'
import { AnnouncementDetailModal } from '@/components/announcement-detail-modal'
import { getAnnouncements, getUsers, getTasks, getApprovals, getCurrentUser } from '@/lib/storage'
import { Announcement, AnnouncementType, User, Task, Approval } from '@/lib/types'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [typeFilter, setTypeFilter] = useState<'all' | AnnouncementType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])

  const currentUser = getCurrentUser()
  const isVisitor = currentUser?.role === 'VISITOR'

  const loadAnnouncements = async () => {
    const [allAnnouncements, usersList, tasksList, approvalsList] = await Promise.all([
      getAnnouncements(),
      getUsers(),
      getTasks(),
      getApprovals(),
    ])

    const announcementsList = Array.isArray(allAnnouncements) ? allAnnouncements : []
    const sortedAnnouncements = announcementsList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setAnnouncements(sortedAnnouncements)
    setUsers(Array.isArray(usersList) ? usersList : [])
    setTasks(Array.isArray(tasksList) ? tasksList : [])
    setApprovals(Array.isArray(approvalsList) ? approvalsList : [])
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (typeFilter !== 'all' && announcement.type !== typeFilter) return false

    if (searchQuery) {
      const title = announcement.title.toLowerCase()
      const content = announcement.type === 'urgent' 
        ? (announcement.content || '').toLowerCase()
        : announcement.items?.map(item => item.content).join(' ').toLowerCase() || ''
      const creator = getUserName(announcement.createdBy).toLowerCase()
      const query = searchQuery.toLowerCase()

      return title.includes(query) || content.includes(query) || creator.includes(query)
    }

    return true
  })

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
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

  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  const platformColors = {
    Android: 'bg-green-500',
    iOS: 'bg-blue-500',
    Web: 'bg-purple-500',
  }

  const urgentCount = announcements.filter((a) => a.type === 'urgent').length
  const patchCount = announcements.filter((a) => a.type === 'patch').length

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공지</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            긴급공지와 패치노트를 작성하고 관리하세요
          </p>
        </div>
        {!isVisitor && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            공지 작성
          </Button>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="제목, 내용, 작성자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-6">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <TabsList>
            <TabsTrigger value="all">
              전체 <Badge variant="secondary" className="ml-2">{announcements.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="urgent">
              긴급공지 <Badge variant="secondary" className="ml-2">{urgentCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="patch">
              패치노트 <Badge variant="secondary" className="ml-2">{patchCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {searchQuery ? '검색 결과가 없습니다.' : '작성된 공지가 없습니다.'}
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const expired = isExpired(announcement.deadline)
            
            return (
              <Card
                key={announcement.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  expired ? 'opacity-60' : ''
                }`}
                onClick={() => handleAnnouncementClick(announcement)}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={platformColors[announcement.platform as keyof typeof platformColors]}>
                        {announcement.platform}
                      </Badge>
                      {announcement.type === 'urgent' ? (
                        <Badge variant="destructive">긴급</Badge>
                      ) : (
                        <Badge variant="outline">v{announcement.version}</Badge>
                      )}
                      {expired && (
                        <Badge variant="destructive" className="text-xs">
                          마감
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="mb-2 font-semibold text-sm leading-tight">
                    {announcement.title}
                  </h3>

                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {announcement.type === 'urgent' 
                      ? announcement.content 
                      : announcement.items?.[0]?.content || '내용 없음'}
                  </p>

                  <div className="mb-2 text-xs text-muted-foreground">
                    마감일: {formatDate(announcement.deadline)}
                    {expired && <span className="ml-1 text-red-500">(마감됨)</span>}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>작성자: {getUserName(announcement.createdBy)}</span>
                    <span>{formatDate(announcement.createdAt)}</span>
                  </div>

                  {announcement.type === 'patch' && (announcement.items?.length || 0) > 1 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      +{(announcement.items?.length || 0) - 1}개 항목 더보기
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <AnnouncementCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onAnnouncementCreated={loadAnnouncements}
      />

      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onAnnouncementUpdated={loadAnnouncements}
      />
    </div>
  )
}
