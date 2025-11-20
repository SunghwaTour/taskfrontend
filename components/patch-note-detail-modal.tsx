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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PatchNote, User as UserType, Task, Approval } from '@/lib/types'
import { getUsers, getTasks, getApprovals, getCurrentUser } from '@/lib/storage'
import { Package, Calendar, User, Trash2, Edit2 } from 'lucide-react'

interface PatchNoteDetailModalProps {
  patchNote: PatchNote | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatchNoteUpdated?: () => void
}

export function PatchNoteDetailModal({
  patchNote,
  open,
  onOpenChange,
  onPatchNoteUpdated,
}: PatchNoteDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPatchNote, setEditedPatchNote] = useState<PatchNote | null>(null)
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

  if (!patchNote) return null

  if (isEditing && !editedPatchNote) {
    setEditedPatchNote({ ...patchNote })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false)
      setEditedPatchNote(null)
    }
    onOpenChange(open)
  }

  const handleSaveEdit = async () => {
    if (!editedPatchNote) return

    try {
      // TODO: Implement updatePatchNote API
      console.log('Update patch note:', editedPatchNote)
      alert('패치노트 수정 기능은 아직 구현되지 않았습니다.')

      setIsEditing(false)
      setEditedPatchNote(null)
      // onPatchNoteUpdated?.()
    } catch (error) {
      console.error('Failed to update patch note:', error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedPatchNote(null)
  }

  const handleDelete = async () => {
    if (!confirm('이 패치노트를 삭제하시겠습니까?')) return

    try {
      // TODO: Implement deletePatchNote API
      console.log('Delete patch note:', patchNote.id)
      alert('패치노트 삭제 기능은 아직 구현되지 않았습니다.')

      // onOpenChange(false)
      // onPatchNoteUpdated?.()
    } catch (error) {
      console.error('Failed to delete patch note:', error)
    }
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

  const getRelatedTask = () => {
    const approval = approvals.find((a) => a.id === patchNote.approvalId)
    if (!approval) return null
    return tasks.find((t) => t.id === approval.taskId)
  }

  const relatedTask = getRelatedTask()

  const isExpired = () => {
    return new Date(patchNote.deadline) < new Date()
  }

  const expired = isExpired()

  const platformColors = {
    Android: 'bg-green-500',
    iOS: 'bg-blue-500',
    Web: 'bg-purple-500',
  }

  const isAuthor = currentUser?.id === patchNote.createdBy
  const canEdit = isAuthor
  const canDelete = isAuthor

  const displayPatchNote = editedPatchNote || patchNote

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            패치노트 상세
            {expired && (
              <Badge variant="destructive" className="ml-2">
                마감됨
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            {isEditing ? (
              <Input
                type="text"
                value={editedPatchNote?.title || ''}
                onChange={(e) => setEditedPatchNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="text-xl font-bold"
                placeholder="패치노트 제목"
              />
            ) : (
              <h2 className="text-xl font-bold">{displayPatchNote.title}</h2>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={platformColors[displayPatchNote.platform]}>{displayPatchNote.platform}</Badge>
            {isEditing ? (
              <Input
                type="text"
                value={editedPatchNote?.version || ''}
                onChange={(e) => setEditedPatchNote(prev => prev ? { ...prev, version: e.target.value } : null)}
                className="w-32 h-7 text-sm"
                placeholder="버전"
              />
            ) : (
              <Badge variant="outline">v{displayPatchNote.version}</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">작성자:</span>
              <span className="font-medium">{getUserName(displayPatchNote.createdBy)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">작성일:</span>
              <span className="font-medium">{formatDate(displayPatchNote.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">마감일:</span>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedPatchNote?.deadline.split('T')[0] || ''}
                  onChange={(e) => setEditedPatchNote(prev => prev ? { ...prev, deadline: new Date(e.target.value).toISOString() } : null)}
                  className="h-7 text-sm"
                />
              ) : (
                <span className={`font-medium ${expired ? 'text-red-500' : ''}`}>
                  {formatDate(displayPatchNote.deadline)}
                  {expired && ' (마감됨)'}
                </span>
              )}
            </div>
          </div>

          {relatedTask && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 text-sm font-semibold">연관 업무</h3>
                <div className="rounded-md border border-border bg-card p-3">
                  <div className="font-medium text-sm">{relatedTask.title}</div>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {relatedTask.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {relatedTask.service}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="mb-4 text-sm font-semibold">패치 내용</h3>
            <div className="space-y-6">
              {displayPatchNote.items.map((item, index) => (
                <div key={item.id} className="rounded-md border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm">업데이트 항목</span>
                  </div>

                  {isEditing ? (
                    <Textarea
                      value={item.content}
                      onChange={(e) => {
                        const newItems = [...(editedPatchNote?.items || [])]
                        newItems[index] = { ...newItems[index], content: e.target.value }
                        setEditedPatchNote(prev => prev ? { ...prev, items: newItems } : null)
                      }}
                      rows={3}
                      className="mt-3 text-sm"
                    />
                  ) : (
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                      {item.content}
                    </div>
                  )}

                  {item.image && (
                    <div className="mt-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={`패치노트 이미지 ${index + 1}`}
                        className="w-full rounded-md border border-border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

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
    </Dialog>
  )
}
