'use client'

import { useState, useEffect } from 'react'
import { Clock, User, MessageSquare, X, Link2, Trash2, Edit2, Upload, Download } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import DOMPurify from 'dompurify'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Task, Comment, User as UserType, Approval } from '@/lib/types'
import { getCurrentUser, getUsers, updateTask, getTasks, getApprovals, deleteTask, uploadTaskFile, deleteTaskFile, addTaskComment, updateTaskComment, deleteTaskComment } from '@/lib/storage'

interface TaskDetailModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: () => void
  onTaskClick?: (taskId: string) => void
}

export function TaskDetailModal({ task, open, onOpenChange, onTaskUpdated, onTaskClick }: TaskDetailModalProps) {
  const [commentContent, setCommentContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [allApprovals, setAllApprovals] = useState<Approval[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(task)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')

  const currentUser = getCurrentUser()

  useEffect(() => {
    const loadData = async () => {
      if (!task) return

      // Fetch full task details with files
      const { getTask } = await import('@/lib/storage')
      const fullTask = await getTask(task.id)
      if (fullTask) {
        setCurrentTask(fullTask)
      }

      const [usersList, tasksList, approvalsList] = await Promise.all([
        getUsers(),
        getTasks(),
        getApprovals(),
      ])
      setUsers(Array.isArray(usersList) ? usersList : [])
      setAllTasks(Array.isArray(tasksList) ? tasksList : [])
      setAllApprovals(Array.isArray(approvalsList) ? approvalsList : [])
    }

    if (open && task) {
      loadData()
    }
  }, [open, task])

  if (!task || !currentTask) return null

  // Debug: Log task files
  console.log('=== TASK DETAIL MODAL DEBUG ===')
  console.log('Task ID:', currentTask.id)
  console.log('Task Title:', currentTask.title)
  console.log('Task files array:', currentTask.files)
  console.log('Task files length:', currentTask.files?.length)
  if (currentTask.files && currentTask.files.length > 0) {
    console.log('First file:', currentTask.files[0])
  }
  console.log('=== END DEBUG ===')

  if (isEditing && !editedTask) {
    setEditedTask({ ...currentTask })
  }

  const relatedTasks = allTasks.filter((t) => currentTask.relatedTasks.includes(t.id))

  const followUpTasks = allTasks.filter((t) => t.relatedTasks.includes(currentTask.id))

  const approvalNextTasks = allApprovals
    .filter((a) => a.taskId === currentTask.id && a.nextTasks.length > 0)
    .flatMap((a) => a.nextTasks)
    .map((taskId) => allTasks.find((t) => t.id === taskId))
    .filter((t): t is Task => t !== undefined)

  const handleAddComment = async () => {
    if (!commentContent.trim() || !currentUser) return

    try {
      const success = await addTaskComment(task.id, commentContent)

      if (success) {
        setCommentContent('')

        // Refresh the task to get updated comments
        const { getTask } = await import('@/lib/storage')
        const updatedTask = await getTask(task.id)
        if (updatedTask) {
          setCurrentTask(updatedTask)
        }

        onTaskUpdated?.()
      } else {
        alert('댓글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    }
  }

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId)
    setEditingCommentContent(content)
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return

    try {
      const success = await updateTaskComment(task.id, commentId, editingCommentContent)

      if (success) {
        setEditingCommentId(null)
        setEditingCommentContent('')

        // Refresh the task to get updated comments
        const { getTask } = await import('@/lib/storage')
        const updatedTask = await getTask(task.id)
        if (updatedTask) {
          setCurrentTask(updatedTask)
        }

        onTaskUpdated?.()
      } else {
        alert('댓글 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert('댓글 수정 중 오류가 발생했습니다.')
    }
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const success = await deleteTaskComment(task.id, commentId)

      if (success) {
        // Refresh the task to get updated comments
        const { getTask } = await import('@/lib/storage')
        const updatedTask = await getTask(task.id)
        if (updatedTask) {
          setCurrentTask(updatedTask)
        }

        onTaskUpdated?.()
      } else {
        alert('댓글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSaveEdit = async () => {
    if (!editedTask) return

    try {
      await updateTask(task.id, {
        title: editedTask.title,
        content: editedTask.content,
        startDate: editedTask.startDate,
        dueDate: editedTask.dueDate,
      })

      setIsEditing(false)
      setEditedTask(null)
      onTaskUpdated?.()
    } catch (error) {
      console.error('Failed to save edit:', error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTask(null)
  }

  const handleDelete = async () => {
    if (!canDeleteTask) {
      alert('완료 상태의 결재가 있는 업무는 삭제할 수 없습니다. 결재를 취소하거나 업무 내용만 수정해주세요.')
      return
    }

    if (!confirm('이 업무를 삭제하시겠습니까?')) return

    try {
      await deleteTask(task.id)
      onOpenChange(false)
      onTaskUpdated?.()
    } catch (error) {
      console.error('Failed to delete task:', error)
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

  const handleTaskClick = (taskId: string) => {
    onOpenChange(false)
    setTimeout(() => {
      onTaskClick?.(taskId)
    }, 100)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false)
      setEditedTask(null)
      setSelectedFiles([])
      setUploading(false)
      setEditingCommentId(null)
      setEditingCommentContent('')
    }
    onOpenChange(open)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleFileUpload = async () => {
    if (!task || selectedFiles.length === 0) return

    setUploading(true)
    try {
      for (const file of selectedFiles) {
        await uploadTaskFile(task.id, file, file.name, '기타')
      }
      setSelectedFiles([])

      // Refresh the task to get updated file list
      const { getTask } = await import('@/lib/storage')
      const updatedTask = await getTask(task.id)
      if (updatedTask) {
        setCurrentTask(updatedTask)
      }

      await onTaskUpdated?.()
      alert('파일이 업로드되었습니다.')
    } catch (error) {
      console.error('Failed to upload files:', error)
      alert('파일 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!task || !confirm('파일을 삭제하시겠습니까?')) return

    try {
      await deleteTaskFile(task.id, fileId)

      // Refresh the task to get updated file list
      const { getTask } = await import('@/lib/storage')
      const updatedTask = await getTask(task.id)
      if (updatedTask) {
        setCurrentTask(updatedTask)
      }

      await onTaskUpdated?.()
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('파일 삭제 중 오류가 발생했습니다.')
    }
  }

  const hasApproval = allApprovals.some((a) => a.taskId === task.id)
  const isTaskCompleted = currentTask.status === 'DONE'
  
  const isAuthor = currentUser?.id === task.createdBy
  
  const canDeleteTask = 
    currentUser && ['CEO', 'TEAM_LEADER'].includes(currentUser.role) ||
    !hasApproval ||
    (hasApproval && !isTaskCompleted)
  
  const canEdit = isAuthor
  const canDelete = isAuthor && canDeleteTask

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] sm:max-w-[1400px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? (
              <input
                type="text"
                value={editedTask?.title || ''}
                onChange={(e) => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-1 text-xl"
              />
            ) : (
              <span className="text-xl">{task.title}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{task.category}</Badge>
            <Badge variant="outline">{task.service}</Badge>
            <Badge>{task.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">작성자:</span>{' '}
              <span className="font-medium">{getUserName(task.createdBy)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">작성일:</span>{' '}
              <span className="font-medium">{formatDate(task.createdAt)}</span>
            </div>
            {task.startDate && (
              <div>
                <span className="text-muted-foreground">시작일:</span>{' '}
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTask?.startDate || ''}
                    onChange={(e) => setEditedTask(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                ) : (
                  <span className="font-medium">{task.startDate}</span>
                )}
              </div>
            )}
            {task.dueDate && (
              <div>
                <span className="text-muted-foreground">마감일:</span>{' '}
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTask?.dueDate || ''}
                    onChange={(e) => setEditedTask(prev => prev ? { ...prev, dueDate: e.target.value } : null)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                ) : (
                  <span className="font-medium">{task.dueDate}</span>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">담당자</h3>
            <div className="flex flex-wrap gap-2">
              {currentTask.assignees && currentTask.assignees.length > 0 ? (
                currentTask.assignees.map((userId) => (
                  <Badge key={userId} variant="secondary">
                    {getUserName(userId)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">지정된 담당자 없음</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">참조 (CC)</h3>
            <div className="flex flex-wrap gap-2">
              {currentTask.cc && currentTask.cc.length > 0 ? (
                currentTask.cc.map((userId) => (
                  <Badge key={userId} variant="outline">
                    {getUserName(userId)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">지정된 참조자 없음</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">내용</h3>
            {isEditing ? (
              <RichTextEditor
                content={editedTask?.content || ''}
                onChange={(newContent) => setEditedTask(prev => prev ? { ...prev, content: newContent } : null)}
                placeholder="내용을 입력하세요..."
              />
            ) : (
              <div
                className="prose prose-sm max-w-none rounded-md bg-muted p-4 min-h-[100px]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentTask.content || '<p class="text-muted-foreground">내용 없음</p>') }}
              />
            )}
          </div>

          {relatedTasks.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4" />
                연관 업무 ({relatedTasks.length})
              </h3>
              <div className="space-y-2">
                {relatedTasks.map((relatedTask) => (
                  <button
                    key={relatedTask.id}
                    onClick={() => handleTaskClick(relatedTask.id)}
                    className="w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="font-medium text-sm">{relatedTask.title}</div>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {relatedTask.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {relatedTask.service}
                      </Badge>
                      <Badge className="text-xs">{relatedTask.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(followUpTasks.length > 0 || approvalNextTasks.length > 0) && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4" />
                후속 업무 ({followUpTasks.length + approvalNextTasks.length})
              </h3>
              <div className="space-y-2">
                {[...followUpTasks, ...approvalNextTasks].map((followUpTask) => (
                  <button
                    key={followUpTask.id}
                    onClick={() => handleTaskClick(followUpTask.id)}
                    className="w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="font-medium text-sm">{followUpTask.title}</div>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {followUpTask.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {followUpTask.service}
                      </Badge>
                      <Badge className="text-xs">{followUpTask.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Upload className="h-4 w-4" />
              첨부 파일 ({currentTask.files?.length || 0})
            </h3>

            <div className="space-y-3">
              {currentTask.files && currentTask.files.length > 0 && (
                <div className="space-y-2">
                  {currentTask.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-md border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <Download className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <a
                            href={file.firebaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="block text-sm font-medium hover:text-primary hover:underline truncate"
                          >
                            {file.name}
                          </a>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {new Date(file.uploadedAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={file.firebaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            다운로드
                          </a>
                        </Button>
                        {(isAuthor || task.assignees.includes(currentUser?.id || '')) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDelete(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(isAuthor || task.assignees.includes(currentUser?.id || '')) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleFileSelect}
                      multiple
                      className="flex-1"
                    />
                    <Button
                      onClick={handleFileUpload}
                      size="sm"
                      disabled={uploading || selectedFiles.length === 0}
                    >
                      {uploading ? '업로드 중...' : '업로드'}
                    </Button>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {selectedFiles.length}개 파일 선택됨
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" />
              댓글 ({currentTask.comments?.length || 0})
            </h3>

            <div className="space-y-4">
              {currentTask.comments?.map((comment) => {
                const isCommentAuthor = currentUser?.id === comment.createdBy
                const isEditingThis = editingCommentId === comment.id

                return (
                  <div key={comment.id} className="rounded-md border border-border bg-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-sm">{getUserName(comment.createdBy)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                        {isCommentAuthor && !isEditingThis && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComment(comment.id, comment.content)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {isEditingThis ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          rows={3}
                          className="text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEditComment}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateComment(comment.id)}
                          >
                            수정
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{comment.content}</p>
                    )}
                  </div>
                )
              })}

              <div className="space-y-2">
                <Textarea
                  placeholder="댓글을 작성하세요..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddComment} size="sm">
                    댓글 작성
                  </Button>
                </div>
              </div>
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
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={!canDeleteTask}
                    title={!canDeleteTask ? '완료 상태의 결재가 있는 업무는 삭제할 수 없습니다' : ''}
                  >
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
