'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Report, User as UserType, Task } from '@/lib/types'
import { getUsers, getTasks, deleteReport, updateReport, getCurrentUser } from '@/lib/storage'
import { formatWeekLabel } from '@/lib/utils/date'
import { FileText, Calendar, User, Trash2, Edit2 } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { TaskDetailModal } from '@/components/task-detail-modal'

interface ReportDetailModalProps {
  report: Report | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReportUpdated?: () => void
  onTaskClick?: (taskId: string) => void
}

export function ReportDetailModal({ report, open, onOpenChange, onReportUpdated, onTaskClick }: ReportDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [users, setUsers] = useState<UserType[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [navigationTaskId, setNavigationTaskId] = useState<string | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)

  const currentUser = getCurrentUser()

  useEffect(() => {
    const loadData = async () => {
      const [usersList, tasksList] = await Promise.all([
        getUsers(),
        getTasks(),
      ])
      setUsers(Array.isArray(usersList) ? usersList : [])
      setTasks(Array.isArray(tasksList) ? tasksList : [])
    }

    if (open) {
      loadData()
    }
  }, [open])

  if (!report) return null

  if (isEditing && !editedContent) {
    setEditedContent(report.content)
  }

  const handleSaveEdit = async () => {
    try {
      await updateReport(report.id, { content: editedContent })
      setIsEditing(false)
      setEditedContent('')
      onReportUpdated?.()
    } catch (error) {
      console.error('Failed to save report:', error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent('')
  }

  const handleDelete = async () => {
    if (!confirm('이 보고서를 삭제하시겠습니까?')) return

    try {
      await deleteReport(report.id)
      onOpenChange(false)
      onReportUpdated?.()
    } catch (error) {
      console.error('Failed to delete report:', error)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false)
      setEditedContent('')
    }
    onOpenChange(open)
  }

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || '알 수 없음'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPeriodLabel = () => {
    if (report.type === 'WEEKLY' && report.weekNumber) {
      return formatWeekLabel(parseInt(report.year), parseInt(report.weekNumber))
    } else if (report.type === 'MONTHLY' && report.month) {
      return `${report.year}년 ${report.month}월`
    }
    return ''
  }

  const handleTaskClick = (taskId: string) => {
    if (onTaskClick) {
      onOpenChange(false)
      setTimeout(() => {
        onTaskClick(taskId)
      }, 100)
    } else {
      setNavigationTaskId(taskId)
      setTaskModalOpen(true)
    }
  }

  const isAuthor = currentUser?.id === report.createdBy
  const canEdit = isAuthor
  const canDelete = isAuthor

  const navigationTask = navigationTaskId ? tasks.find((t) => t.id === navigationTaskId) || null : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {report.type === 'WEEKLY' ? '주간 보고서' : '월간 보고서'}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{getPeriodLabel()}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">작성자:</span>
              <span className="font-medium">{getUserName(report.createdBy)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">작성일:</span>
              <span className="font-medium">{formatDate(report.createdAt)}</span>
            </div>
          </div>

          <Separator />
          <div>
            <h3 className="mb-2 text-sm font-semibold">내용</h3>
            {isEditing ? (
              <RichTextEditor
                content={editedContent}
                onChange={setEditedContent}
                placeholder="보고서 내용을 입력하세요..."
              />
            ) : (
              <div
                className="prose prose-sm max-w-none rounded-md bg-muted p-4"
                dangerouslySetInnerHTML={{ __html: report.content }}
              />
            )}
          </div>

          {report.tasks && report.tasks.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">관련 업무 ({report.tasks.length}건)</h3>
                <div className="space-y-2">
                  {report.tasks.map((taskId) => {
                    const task = tasks.find((t) => t.id === taskId)
                    return task ? (
                      <button
                        key={taskId}
                        onClick={() => handleTaskClick(task.id)}
                        className="w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                      >
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {task.service}
                          </Badge>
                          <Badge className="text-xs">{task.status}</Badge>
                        </div>
                      </button>
                    ) : null
                  })}
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="flex justify-between">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  취소
                </Button>
                <Button onClick={handleSaveEdit}>
                  저장
                </Button>
              </>
            ) : (
              <div className="ml-auto flex gap-2">
                {canEdit && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                )}
                {canDelete && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <TaskDetailModal
        task={navigationTask}
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onTaskUpdated={async () => {
          const tasksList = await getTasks()
          setTasks(Array.isArray(tasksList) ? tasksList : [])
        }}
        onTaskClick={handleTaskClick}
      />
    </Dialog>
  )
}
