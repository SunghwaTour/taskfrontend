'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { PatchNote, PatchNoteItem, PlatformType, Approval, Task } from '@/lib/types'
import { addPatchNote, getApprovals, getTasks, getCurrentUser } from '@/lib/storage'

interface PatchNoteCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatchNoteCreated?: () => void
}

export function PatchNoteCreateModal({
  open,
  onOpenChange,
  onPatchNoteCreated,
}: PatchNoteCreateModalProps) {
  const [title, setTitle] = useState('')
  const [selectedApprovalId, setSelectedApprovalId] = useState('')
  const [platform, setPlatform] = useState<PlatformType>('Android')
  const [version, setVersion] = useState('')
  const [deadline, setDeadline] = useState('')
  const [items, setItems] = useState<Omit<PatchNoteItem, 'id'>[]>([
    { content: '', image: '' },
  ])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const currentUser = getCurrentUser()

  useEffect(() => {
    const loadData = async () => {
      const [approvalsList, tasksList] = await Promise.all([
        getApprovals(),
        getTasks(),
      ])
      setApprovals(
        Array.isArray(approvalsList)
          ? approvalsList.filter((a) => a.status === 'APPROVED')
          : []
      )
      setTasks(Array.isArray(tasksList) ? tasksList : [])
    }

    if (open) {
      loadData()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !selectedApprovalId) return

    try {
      const patchNoteItems: PatchNoteItem[] = items
        .filter((item) => item.content.trim() !== '')
        .map((item, index) => ({
          id: `${Date.now()}-${index}`,
          content: item.content,
          image: item.image || undefined,
        }))

      const newPatchNote: PatchNote = {
        id: Date.now().toString(),
        title,
        approvalId: selectedApprovalId,
        platform,
        version,
        items: patchNoteItems,
        deadline,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      }

      await addPatchNote(newPatchNote)
      onPatchNoteCreated?.()
      handleClose()
    } catch (error) {
      console.error('Failed to create patch note:', error)
    }
  }

  const handleClose = () => {
    setTitle('')
    setSelectedApprovalId('')
    setPlatform('Android')
    setVersion('')
    setDeadline('')
    setItems([{ content: '', image: '' }])
    onOpenChange(false)
  }

  const addItem = () => {
    setItems([...items, { content: '', image: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: 'content' | 'image', value: string) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const getTaskTitle = (approvalId: string) => {
    const approval = approvals.find((a) => a.id === approvalId)
    if (!approval) return ''
    const task = tasks.find((t) => t.id === approval.taskId)
    return task?.title || ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>패치노트 작성</DialogTitle>
          <DialogDescription>승인된 업무에 대한 패치노트를 작성하세요</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="패치노트 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approval">승인된 업무 선택 *</Label>
            <Select value={selectedApprovalId} onValueChange={setSelectedApprovalId}>
              <SelectTrigger id="approval">
                <SelectValue placeholder="승인된 업무를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {approvals.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    승인된 업무가 없습니다
                  </div>
                ) : (
                  approvals.map((approval) => (
                    <SelectItem key={approval.id} value={approval.id}>
                      {getTaskTitle(approval.id)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">플랫폼 *</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformType)}>
                <SelectTrigger id="platform">
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
              <Label htmlFor="version">버전 *</Label>
              <Input
                id="version"
                placeholder="예: 1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">마감일 *</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              마감일이 지나면 패치노트가 비활성화됩니다
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>패치노트 항목</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-3 w-3" />
                항목 추가
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="rounded-md border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-sm">항목 {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`content-${index}`}>내용 *</Label>
                      <Textarea
                        id={`content-${index}`}
                        placeholder="패치노트 내용을 작성하세요"
                        value={item.content}
                        onChange={(e) => updateItem(index, 'content', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`image-${index}`}>이미지 URL (선택)</Label>
                      <Input
                        id={`image-${index}`}
                        placeholder="https://example.com/image.png"
                        value={item.image}
                        onChange={(e) => updateItem(index, 'image', e.target.value)}
                      />
                      {item.image && (
                        <div className="mt-2">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={`Preview ${index + 1}`}
                            className="h-40 w-full rounded-md object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={!title || !selectedApprovalId || !version || !deadline}>
              등록
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
