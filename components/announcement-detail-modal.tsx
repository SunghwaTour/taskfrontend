'use client'

import { useState, useEffect } from 'react'
import { Calendar, UserIcon, Package, AlertCircle, Edit2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Announcement, PlatformType, UrgentPlatformType, User as UserType, Task, Approval } from '@/lib/types'
import { getUsers, getTasks, getApprovals, getCurrentUser, updateAnnouncement, deleteAnnouncement } from '@/lib/storage'

interface AnnouncementDetailModalProps {
  announcement: Announcement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAnnouncementUpdated?: () => void
}

export function AnnouncementDetailModal({
  announcement,
  open,
  onOpenChange,
  onAnnouncementUpdated,
}: AnnouncementDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedAnnouncement, setEditedAnnouncement] = useState<Announcement | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])

  const currentUser = getCurrentUser()

  useEffect(() => {
    const loadData = async () => {
      const [usersList, tasksList, approvalsList] = await Promise.all([
        getUsers(),
        getTasks(),
        getApprovals(),
      ])
      setUsers(Array.isArray(usersList) ? usersList : [])
      setTasks(Array.isArray(tasksList) ? tasksList : [])
      setApprovals(Array.isArray(approvalsList) ? approvalsList : [])
    }

    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (announcement) {
      setEditedAnnouncement({ ...announcement })
    }
    setIsEditing(false)
  }, [announcement])

  if (!announcement || !editedAnnouncement) return null

  const creator = users.find((u) => u.id === announcement.createdBy)
  const isOwner = currentUser?.id === announcement.createdBy

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  const getTaskTitle = (approvalId: string) => {
    const approval = approvals.find((a) => a.id === approvalId)
    if (!approval) return '알 수 없음'
    const task = tasks.find((t) => t.id === approval.taskId)
    return task?.title || '알 수 없음'
  }

  const handleSave = async () => {
    if (!editedAnnouncement) return

    try {
      await updateAnnouncement(editedAnnouncement.id, editedAnnouncement)
      onAnnouncementUpdated?.()
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save announcement:', error)
    }
  }

  const handleCancel = () => {
    setEditedAnnouncement({ ...announcement })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('정말 이 공지를 삭제하시겠습니까?')) return

    try {
      await deleteAnnouncement(announcement.id)
      onAnnouncementUpdated?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete announcement:', error)
    }
  }

  const platformColors = {
    Android: 'bg-green-500',
    iOS: 'bg-blue-500',
    Web: 'bg-purple-500',
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) {
        setIsEditing(false)
        setEditedAnnouncement(announcement ? { ...announcement } : null)
      }
    }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>
                {announcement.type === 'urgent' ? '긴급공지' : '패치노트'}
              </DialogTitle>
              <DialogDescription>공지 상세 정보</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {announcement.type === 'urgent' ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={platformColors[announcement.platform as UrgentPlatformType]}>
                    {announcement.platform}
                  </Badge>
                  <Badge variant={isExpired(announcement.deadline) ? 'destructive' : 'secondary'}>
                    <AlertCircle className="mr-1 h-3 w-3" />
                    긴급
                  </Badge>
                  {isExpired(announcement.deadline) && (
                    <Badge variant="destructive">마감</Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>제목</Label>
                      <Input
                        value={editedAnnouncement.title}
                        onChange={(e) => setEditedAnnouncement({ ...editedAnnouncement, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>부제목</Label>
                      <Input
                        value={editedAnnouncement.subtitle || ''}
                        onChange={(e) => setEditedAnnouncement({ ...editedAnnouncement, subtitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>내용</Label>
                      <Textarea
                        value={editedAnnouncement.content || ''}
                        onChange={(e) => setEditedAnnouncement({ ...editedAnnouncement, content: e.target.value })}
                        rows={6}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>플랫폼</Label>
                        <Select 
                          value={editedAnnouncement.platform} 
                          onValueChange={(v) => setEditedAnnouncement({ ...editedAnnouncement, platform: v as UrgentPlatformType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Android">Android</SelectItem>
                            <SelectItem value="iOS">iOS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>마감일</Label>
                        <Input
                          type="date"
                          value={editedAnnouncement.deadline}
                          onChange={(e) => setEditedAnnouncement({ ...editedAnnouncement, deadline: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="mb-2 text-2xl font-bold">{announcement.title}</h2>
                      {announcement.subtitle && (
                        <p className="text-lg text-muted-foreground">{announcement.subtitle}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="rounded-md bg-muted/50 p-4">
                      <p className="whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={platformColors[announcement.platform as PlatformType]}>
                    {announcement.platform}
                  </Badge>
                  <Badge variant="outline">v{announcement.version}</Badge>
                  {isExpired(announcement.deadline) && (
                    <Badge variant="destructive">마감</Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>제목</Label>
                      <Input
                        value={editedAnnouncement.title}
                        onChange={(e) => setEditedAnnouncement({ ...editedAnnouncement, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>플랫폼</Label>
                        <Select 
                          value={editedAnnouncement.platform} 
                          onValueChange={(v) => setEditedAnnouncement({ ...editedAnnouncement, platform: v as PlatformType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Android">Android</SelectItem>
                            <SelectItem value="iOS">iOS</SelectItem>
                            <SelectItem value="Web">Web</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>버전</Label>
                        <Input
                          value={editedAnnouncement.version || ''}
                          onChange={(e) => setEditedAnnouncement({ ...editedAnnouncement, version: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>마감일</Label>
                      <Input
                        type="date"
                        value={editedAnnouncement.deadline}
                        onChange={(e) => setEditedAnnouncement({ ...editedAnnouncement, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="mb-2 text-2xl font-bold">{announcement.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        연관 업무: {getTaskTitle(announcement.approvalId || '')}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">패치 내용</h3>
                      {announcement.items?.map((item, index) => (
                        <div key={item.id} className="space-y-3 rounded-md border border-border p-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">항목 {index + 1}</span>
                          </div>
                          <p className="leading-relaxed text-sm">{item.content}</p>
                          {item.image && (
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={`Patch note ${index + 1}`}
                              className="h-48 w-full rounded-md object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>작성자: {creator?.name || '알 수 없음'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>작성일: {formatDate(announcement.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className={isExpired(announcement.deadline) ? 'text-red-500' : ''}>
                마감일: {formatDate(announcement.deadline)}
                {isExpired(announcement.deadline) && ' (마감됨)'}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="flex-1">
                    저장
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1">
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1">
                    <Edit2 className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                  <Button onClick={handleDelete} variant="destructive" className="flex-1">
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
