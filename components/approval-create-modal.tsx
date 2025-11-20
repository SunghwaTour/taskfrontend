'use client'

import { useState } from 'react'
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
import { Task, Approval } from '@/lib/types'
import { addApproval, getCurrentUser } from '@/lib/storage'
import { Plus, X } from 'lucide-react'

interface ApprovalCreateModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprovalCreated?: (taskId: string) => void
}

export function ApprovalCreateModal({
  task,
  open,
  onOpenChange,
  onApprovalCreated,
}: ApprovalCreateModalProps) {
  const [summary, setSummary] = useState('')
  const [links, setLinks] = useState<string[]>([''])
  const currentUser = getCurrentUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !task) return

    try {
      const newApproval = {
        taskId: task.id,
        summary,
        links: links.filter((link) => link.trim() !== ''),
        nextTasks: [],
      }

      console.log('Submitting approval:', newApproval)
      const result = await addApproval(newApproval)
      console.log('Approval result:', result)

      if (result) {
        onApprovalCreated?.(task.id)
        handleClose()
      } else {
        console.error('Failed to create approval')
        alert('결재 요청 생성에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('Error creating approval:', error)
      alert('결재 요청 중 오류가 발생했습니다.')
    }
  }

  const handleClose = () => {
    setSummary('')
    setLinks([''])
    onOpenChange(false)
  }

  const addLink = () => {
    setLinks([...links, ''])
  }

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links]
    newLinks[index] = value
    setLinks(newLinks)
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>결재 요청</DialogTitle>
          <DialogDescription>
            업무를 완료하고 결재를 요청합니다: {task.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">요약 내용 *</Label>
            <Textarea
              id="summary"
              placeholder="결재 받을 내용을 요약하여 작성하세요"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>참조 링크</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLink}>
                <Plus className="mr-1 h-3 w-3" />
                링크 추가
              </Button>
            </div>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={link}
                    onChange={(e) => updateLink(index, e.target.value)}
                  />
                  {links.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit">결재 요청</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
