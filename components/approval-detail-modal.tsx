'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, ExternalLink, CheckCircle, XCircle, Plus, Link2, Trash2, Edit2 } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { TaskCreateModal } from '@/components/task-create-modal'
import { Approval, Comment, Task, User as UserType } from '@/lib/types'
import { getCurrentUser, getUsers, updateApproval, getTasks, deleteApproval, updateTask, teamLeaderApprove, ceoApprove } from '@/lib/storage'

interface ApprovalDetailModalProps {
  approval: Approval | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprovalUpdated?: () => void
  onTaskClick?: (taskId: string) => void
}

export function ApprovalDetailModal({
  approval,
  open,
  onOpenChange,
  onApprovalUpdated,
  onTaskClick,
}: ApprovalDetailModalProps) {
  const [commentContent, setCommentContent] = useState('')
  const [teamLeaderComment, setTeamLeaderComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [selectedNextTasks, setSelectedNextTasks] = useState<string[]>([])
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSummary, setEditedSummary] = useState('')
  const [editedLinks, setEditedLinks] = useState<string[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

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

  if (!approval) return null

  if (isEditing && !editedSummary) {
    setEditedSummary(approval.summary)
    setEditedLinks([...approval.links])
  }

  const task = tasks.find((t) => t.id === approval.taskId)
  const canApprove = currentUser && ['CEO', 'TEAM_LEADER'].includes(currentUser.role)
  const hasTeamLeaderApproval = !!approval.teamLeaderApprovedBy
  
  const isAuthor = currentUser?.id === approval.createdBy
  
  const canEdit = !hasTeamLeaderApproval && isAuthor
  const canDelete = currentUser && ['CEO', 'TEAM_LEADER'].includes(currentUser.role)
  
  const needsTeamLeaderApproval =
    approval.status === 'PENDING' && !approval.teamLeaderApprovedBy
  const needsCEOApproval =
    approval.status === 'PENDING' &&
    approval.teamLeaderApprovedBy &&
    !approval.ceoApprovedBy

  const handleAddComment = async () => {
    if (!commentContent.trim() || !currentUser) return

    const newComment: Comment = {
      id: Date.now().toString(),
      content: commentContent,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    }

    try {
      await updateApproval(approval.id, {
        comments: [...approval.comments, newComment],
      })

      setCommentContent('')
      onApprovalUpdated?.()
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleTeamLeaderApprove = async () => {
    if (!currentUser || !teamLeaderComment.trim()) {
      alert('의견을 작성해주세요.')
      return
    }

    try {
      // Call team leader approve endpoint
      const result = await teamLeaderApprove(approval.id, true, teamLeaderComment)

      if (!result) {
        alert('승인 처리 중 오류가 발생했습니다.')
        return
      }

      // Update next tasks if selected
      if (selectedNextTasks.length > 0) {
        await updateApproval(approval.id, {
          nextTasks: selectedNextTasks,
        })
      }

      setTeamLeaderComment('')
      setSelectedNextTasks([])

      // Reload data first
      await onApprovalUpdated?.()

      // Then close modal
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to approve:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    }
  }

  const handleCEOApprove = async () => {
    if (!currentUser) return

    try {
      // Call CEO approve endpoint
      const result = await ceoApprove(approval.id, true)

      if (!result) {
        alert('승인 처리 중 오류가 발생했습니다.')
        return
      }

      // Reload data first
      await onApprovalUpdated?.()

      // Then close modal
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to approve:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async () => {
    if (!currentUser || !rejectionReason.trim()) {
      alert('반려 사유를 작성해주세요.')
      return
    }

    try {
      let result = null

      // Determine which approve endpoint to call based on current approval stage
      if (needsTeamLeaderApproval && currentUser.role === 'TEAM_LEADER') {
        // Team leader rejection
        result = await teamLeaderApprove(approval.id, false, undefined, rejectionReason)
      } else if (needsCEOApproval && currentUser.role === 'CEO') {
        // CEO rejection
        result = await ceoApprove(approval.id, false, undefined, rejectionReason)
      } else {
        alert('반려 권한이 없습니다.')
        return
      }

      if (!result) {
        alert('반려 처리 중 오류가 발생했습니다.')
        return
      }

      // If task is DONE, revert to DOING
      if (task && task.status === 'DONE') {
        await updateTask(task.id, {
          status: 'DOING',
        })
      }

      setRejectionReason('')
      setShowRejectInput(false)

      // Reload data first
      await onApprovalUpdated?.()

      // Then close modal
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to reject:', error)
      alert('반려 처리 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!canDelete) {
      alert('결재 삭제는 팀장 권한 이상만 가능합니다.')
      return
    }

    if (!confirm('이 결재를 삭제하시겠습니까?')) return

    try {
      await deleteApproval(approval.id)
      onOpenChange(false)
      onApprovalUpdated?.()
    } catch (error) {
      console.error('Failed to delete approval:', error)
    }
  }

  const handleAddLinkField = () => {
    setEditedLinks([...editedLinks, ''])
  }

  const handleUpdateLink = (index: number, value: string) => {
    const newLinks = [...editedLinks]
    newLinks[index] = value
    setEditedLinks(newLinks)
  }

  const handleRemoveLink = (index: number) => {
    setEditedLinks(editedLinks.filter((_, i) => i !== index))
  }

  const handleSaveEdit = async () => {
    try {
      await updateApproval(approval.id, {
        summary: editedSummary,
        links: editedLinks,
      })

      setIsEditing(false)
      setEditedSummary('')
      setEditedLinks([])
      onApprovalUpdated?.()
    } catch (error) {
      console.error('Failed to save edit:', error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedSummary('')
    setEditedLinks([])
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

  const toggleNextTask = (taskId: string) => {
    setSelectedNextTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    )
  }

  const statusLabels = {
    PENDING: '대기',
    APPROVED: '승인',
    REJECTED: '반려',
  }

  const statusColors = {
    PENDING: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
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
      setEditedSummary('')
      setEditedLinks([])
    }
    onOpenChange(open)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">결재 상세</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge className={statusColors[approval.status]}>{statusLabels[approval.status]}</Badge>
              {task && (
                <button
                  onClick={() => handleTaskClick(task.id)}
                  className="font-medium hover:underline"
                >
                  {task.title}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">요청자:</span>{' '}
                <span className="font-medium">{getUserName(approval.createdBy)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">요청일:</span>{' '}
                <span className="font-medium">{formatDate(approval.createdAt)}</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">요약 내용</h3>
              {isEditing ? (
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                  {approval.summary}
                </div>
              )}
            </div>

            {(approval.links.length > 0 || isEditing) && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">참조 링크</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    {editedLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => handleUpdateLink(index, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLink(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddLinkField}>
                      <Plus className="mr-2 h-4 w-4" />
                      링크 추가
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approval.links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {approval.teamLeaderApprovedBy && (
              <div className="rounded-md border border-green-500/50 bg-green-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-sm">팀장 결재 완료</span>
                </div>
                <div className="mb-2 text-sm">
                  <span className="text-muted-foreground">승인자:</span>{' '}
                  <span className="font-medium">
                    {getUserName(approval.teamLeaderApprovedBy)}
                  </span>
                  {' · '}
                  <span className="text-muted-foreground">승인일:</span>{' '}
                  <span>{formatDate(approval.teamLeaderApprovedAt!)}</span>
                </div>
                {approval.teamLeaderComment && (
                  <div>
                    <span className="text-sm font-medium">의견:</span>
                    <p className="mt-1 text-sm">{approval.teamLeaderComment}</p>
                  </div>
                )}
              </div>
            )}

            {needsTeamLeaderApproval && canApprove && currentUser.role === 'TEAM_LEADER' && (
              <div className="space-y-4 rounded-md border border-border bg-card p-4">
                <h3 className="font-semibold">팀장 결재</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="teamLeaderComment">의견 (필수)</Label>
                  <Textarea
                    id="teamLeaderComment"
                    placeholder="결재 의견을 작성하세요"
                    value={teamLeaderComment}
                    onChange={(e) => setTeamLeaderComment(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>다음 연관 업무 지정 (선택)</Label>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                    {tasks
                      .filter((t) => t.id !== approval.taskId)
                      .map((task) => (
                        <div key={task.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`next-${task.id}`}
                            checked={selectedNextTasks.includes(task.id)}
                            onCheckedChange={() => toggleNextTask(task.id)}
                          />
                          <label htmlFor={`next-${task.id}`} className="flex-1 cursor-pointer text-sm">
                            {task.title}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <Button
                    variant="outline"
                    onClick={() => setFollowUpModalOpen(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    후속 업무 생성
                  </Button>
                </div>

                {showRejectInput && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">반려 사유 (필수)</Label>
                    <Textarea
                      id="rejectionReason"
                      placeholder="반려 사유를 작성하세요"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {!showRejectInput ? (
                    <>
                      <Button onClick={handleTeamLeaderApprove} className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        승인
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectInput(true)}
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        반려
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleReject} variant="destructive" className="flex-1">
                        <XCircle className="mr-2 h-4 w-4" />
                        반려 확정
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectInput(false)
                          setRejectionReason('')
                        }}
                        className="flex-1"
                      >
                        취소
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {approval.ceoApprovedBy && (
              <div className="rounded-md border border-green-500/50 bg-green-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-sm">대표 결재 완료</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">승인자:</span>{' '}
                  <span className="font-medium">{getUserName(approval.ceoApprovedBy)}</span>
                  {' · '}
                  <span className="text-muted-foreground">승인일:</span>{' '}
                  <span>{formatDate(approval.ceoApprovedAt!)}</span>
                </div>
              </div>
            )}

            {needsCEOApproval && canApprove && currentUser.role === 'CEO' && (
              <div className="space-y-4 rounded-md border border-border bg-card p-4">
                <h3 className="font-semibold">대표 결재</h3>

                {approval.teamLeaderComment && (
                  <div className="rounded-md bg-muted p-3">
                    <span className="text-sm font-medium">팀장 의견:</span>
                    <p className="mt-1 text-sm">{approval.teamLeaderComment}</p>
                  </div>
                )}

                {showRejectInput && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReasonCEO">반려 사유 (필수)</Label>
                    <Textarea
                      id="rejectionReasonCEO"
                      placeholder="반려 사유를 작성하세요"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {!showRejectInput ? (
                    <>
                      <Button onClick={handleCEOApprove} className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        최종 승인
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectInput(true)}
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        반려
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleReject} variant="destructive" className="flex-1">
                        <XCircle className="mr-2 h-4 w-4" />
                        반려 확정
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectInput(false)
                          setRejectionReason('')
                        }}
                        className="flex-1"
                      >
                        취소
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {approval.status === 'REJECTED' && approval.rejectionReason && (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-sm">반려됨</span>
                </div>
                <div>
                  <span className="text-sm font-medium">반려 사유:</span>
                  <p className="mt-1 text-sm">{approval.rejectionReason}</p>
                </div>
              </div>
            )}

            {approval.nextTasks.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Link2 className="h-4 w-4" />
                  연관 업무
                </h3>
                <div className="space-y-2">
                  {approval.nextTasks.map((taskId) => {
                    const nextTask = tasks.find((t) => t.id === taskId)
                    return nextTask ? (
                      <button
                        key={taskId}
                        onClick={() => handleTaskClick(nextTask.id)}
                        className="w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                      >
                        <div className="font-medium text-sm">{nextTask.title}</div>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {nextTask.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {nextTask.service}
                          </Badge>
                        </div>
                      </button>
                    ) : null
                  })}
                </div>
              </div>
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
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      title={!canDelete ? '결재 삭제는 팀장 권한 이상만 가능합니다' : ''}
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

      <TaskCreateModal
        open={followUpModalOpen}
        onOpenChange={setFollowUpModalOpen}
        onTaskCreated={() => {
          setFollowUpModalOpen(false)
          onApprovalUpdated?.()
        }}
      />
    </>
  )
}
