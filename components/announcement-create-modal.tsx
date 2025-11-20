'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Announcement, AnnouncementType, PatchNoteItem, PlatformType, UrgentPlatformType, Approval, Task } from '@/lib/types'
import { addAnnouncement, getApprovals, getTasks, getCurrentUser } from '@/lib/storage'

interface AnnouncementCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAnnouncementCreated?: () => void
}

export function AnnouncementCreateModal({
  open,
  onOpenChange,
  onAnnouncementCreated,
}: AnnouncementCreateModalProps) {
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>('urgent')

  // Urgent announcement fields
  const [urgentTitle, setUrgentTitle] = useState('')
  const [urgentSubtitle, setUrgentSubtitle] = useState('')
  const [urgentContent, setUrgentContent] = useState('')
  const [urgentPlatform, setUrgentPlatform] = useState<UrgentPlatformType>('Android')
  const [urgentDeadline, setUrgentDeadline] = useState('')

  // Patch note fields
  const [patchTitle, setPatchTitle] = useState('')
  const [selectedApprovalId, setSelectedApprovalId] = useState('')
  const [patchPlatform, setPatchPlatform] = useState<PlatformType>('Android')
  const [version, setVersion] = useState('')
  const [patchDeadline, setPatchDeadline] = useState('')
  const [items, setItems] = useState<Omit<PatchNoteItem, 'id'>[]>([
    { content: '', image: '' },
  ])

  // Data states
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const currentUser = getCurrentUser()

  useEffect(() => {
    const loadData = async () => {
      const approvalsList = await getApprovals()
      const tasksList = await getTasks()

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

    if (!currentUser) return

    try {
      if (announcementType === 'urgent') {
        const newAnnouncement = {
          type: 'urgent' as const,
          title: urgentTitle,
          subtitle: urgentSubtitle,
          content: urgentContent,
          platform: urgentPlatform,
          deadline: urgentDeadline,
        }
        const result = await addAnnouncement(newAnnouncement)
        if (!result) {
          alert('긴급공지 등록에 실패했습니다.')
          return
        }
      } else {
        if (!selectedApprovalId) return

        const patchNoteItems: PatchNoteItem[] = items
          .filter((item) => item.content.trim() !== '')
          .map((item, index) => ({
            id: `${Date.now()}-${index}`,
            content: item.content,
            image: item.image || undefined,
          }))

        const newAnnouncement = {
          type: 'patch' as const,
          title: patchTitle,
          approvalId: selectedApprovalId,
          platform: patchPlatform,
          version,
          items: patchNoteItems,
          deadline: patchDeadline,
        }
        const result = await addAnnouncement(newAnnouncement)
        if (!result) {
          alert('패치노트 등록에 실패했습니다.')
          return
        }
      }

      await onAnnouncementCreated?.()
      handleClose()
    } catch (error) {
      console.error('Failed to create announcement:', error)
      alert('공지 등록 중 오류가 발생했습니다.')
    }
  }

  const handleClose = () => {
    setAnnouncementType('urgent')
    setUrgentTitle('')
    setUrgentSubtitle('')
    setUrgentContent('')
    setUrgentPlatform('Android')
    setUrgentDeadline('')
    setPatchTitle('')
    setSelectedApprovalId('')
    setPatchPlatform('Android')
    setVersion('')
    setPatchDeadline('')
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
          <DialogTitle>공지 작성</DialogTitle>
          <DialogDescription>긴급공지 또는 패치노트를 작성하세요</DialogDescription>
        </DialogHeader>

        <Tabs value={announcementType} onValueChange={(v) => setAnnouncementType(v as AnnouncementType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="urgent">긴급공지</TabsTrigger>
            <TabsTrigger value="patch">패치노트</TabsTrigger>
          </TabsList>

          <TabsContent value="urgent">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="urgent-title">제목 *</Label>
                <Input
                  id="urgent-title"
                  placeholder="긴급공지 제목을 입력하세요"
                  value={urgentTitle}
                  onChange={(e) => setUrgentTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgent-subtitle">부제목 *</Label>
                <Input
                  id="urgent-subtitle"
                  placeholder="부제목을 입력하세요"
                  value={urgentSubtitle}
                  onChange={(e) => setUrgentSubtitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgent-content">내용 *</Label>
                <Textarea
                  id="urgent-content"
                  placeholder="긴급공지 내용을 입력하세요"
                  value={urgentContent}
                  onChange={(e) => setUrgentContent(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="urgent-platform">플랫폼 *</Label>
                  <Select value={urgentPlatform} onValueChange={(v) => setUrgentPlatform(v as UrgentPlatformType)}>
                    <SelectTrigger id="urgent-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Android">Android</SelectItem>
                      <SelectItem value="iOS">iOS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgent-deadline">마감일 *</Label>
                  <Input
                    id="urgent-deadline"
                    type="date"
                    value={urgentDeadline}
                    onChange={(e) => setUrgentDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleClose}>
                  취소
                </Button>
                <Button type="submit" disabled={!urgentTitle || !urgentSubtitle || !urgentContent || !urgentDeadline}>
                  등록
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="patch">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="patch-title">제목 *</Label>
                <Input
                  id="patch-title"
                  placeholder="패치노트 제목을 입력하세요"
                  value={patchTitle}
                  onChange={(e) => setPatchTitle(e.target.value)}
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
                  <Label htmlFor="patch-platform">플랫폼 *</Label>
                  <Select value={patchPlatform} onValueChange={(v) => setPatchPlatform(v as PlatformType)}>
                    <SelectTrigger id="patch-platform">
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
                <Label htmlFor="patch-deadline">마감일 *</Label>
                <Input
                  id="patch-deadline"
                  type="date"
                  value={patchDeadline}
                  onChange={(e) => setPatchDeadline(e.target.value)}
                  required
                />
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
                <Button type="submit" disabled={!patchTitle || !selectedApprovalId || !version || !patchDeadline}>
                  등록
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
