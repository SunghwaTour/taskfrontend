'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Upload } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Task, TaskCategory, ServiceType, User } from '@/lib/types'
import { addTask, getTasks, getCurrentUser, getUsers, getServices, uploadTaskFile } from '@/lib/storage'

interface TaskCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: () => void
}

export function TaskCreateModal({ open, onOpenChange, onTaskCreated }: TaskCreateModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TaskCategory>('일반')
  const [service, setService] = useState<ServiceType>('Kingbus')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [content, setContent] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [selectedCC, setSelectedCC] = useState<string[]>([])
  const [relatedTasks, setRelatedTasks] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [services, setServices] = useState<ServiceType[]>([])

  useEffect(() => {
    const loadData = async () => {
      const user = getCurrentUser()
      const usersList = await getUsers()
      const tasksList = await getTasks()
      const servicesList = await getServices()

      setCurrentUser(user)
      setUsers(Array.isArray(usersList) ? usersList : [])
      setTasks(Array.isArray(tasksList) ? tasksList : [])
      setServices(Array.isArray(servicesList) ? servicesList : [])
    }

    if (open) {
      loadData()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) return

    setUploading(true)
    try {
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        category,
        relatedTasks,
        service,
        startDate: startDate || null,
        dueDate: dueDate || null,
        content,
        files: [],
        assignees: selectedAssignees,
        cc: selectedCC,
        status: 'BACKLOG',
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [],
      }

      const createdTask = await addTask(newTask)
      console.log('Created task:', createdTask)

      if (!createdTask) {
        alert('업무 등록에 실패했습니다.')
        setUploading(false)
        return
      }

      console.log('Created task ID:', createdTask.id)

      // Upload files if any
      if (selectedFiles.length > 0) {
        console.log('Uploading files for task:', createdTask.id)
        for (const file of selectedFiles) {
          console.log('Uploading file:', file.name)
          await uploadTaskFile(createdTask.id, file, file.name, '기타')
        }
      }

      onTaskCreated?.()
      handleClose()
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('업무 등록 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setCategory('일반')
    setService('Kingbus')
    setStartDate('')
    setDueDate('')
    setContent('')
    setSelectedAssignees([])
    setSelectedCC([])
    setRelatedTasks([])
    setSelectedFiles([])
    setUploading(false)
    onOpenChange(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const toggleCC = (userId: string) => {
    setSelectedCC((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const toggleRelatedTask = (taskId: string) => {
    setRelatedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 업무 등록</DialogTitle>
          <DialogDescription>업무 정보를 입력하여 등록하세요</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="기능명 혹은 배포하는 내용"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="일반">일반</SelectItem>
                  <SelectItem value="기획">기획</SelectItem>
                  <SelectItem value="디자인">디자인</SelectItem>
                  <SelectItem value="개발">개발</SelectItem>
                  <SelectItem value="배포">배포</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">서비스 *</Label>
              <Select value={service} onValueChange={(v) => setService(v as ServiceType)}>
                <SelectTrigger id="service">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">마감일</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {tasks.length > 0 && (
            <div className="space-y-2">
              <Label>연관된 업무</Label>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`related-${task.id}`}
                      checked={relatedTasks.includes(task.id)}
                      onCheckedChange={() => toggleRelatedTask(task.id)}
                    />
                    <label
                      htmlFor={`related-${task.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {task.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              placeholder="업무 내용을 자유롭게 작성하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label>담당자</Label>
            <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-input p-3">
              {users.filter(user => user.role !== 'VISITOR').map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`assignee-${user.id}`}
                    checked={selectedAssignees.includes(user.id)}
                    onCheckedChange={() => toggleAssignee(user.id)}
                  />
                  <label htmlFor={`assignee-${user.id}`} className="flex-1 cursor-pointer text-sm">
                    {user.name} ({user.role})
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>참조 (CC)</Label>
            <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-input p-3">
              {users.filter(user => user.role !== 'VISITOR').map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cc-${user.id}`}
                    checked={selectedCC.includes(user.id)}
                    onCheckedChange={() => toggleCC(user.id)}
                  />
                  <label htmlFor={`cc-${user.id}`} className="flex-1 cursor-pointer text-sm">
                    {user.name} ({user.role})
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">첨부 파일</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  id="files"
                  type="file"
                  onChange={handleFileSelect}
                  multiple
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-2"
                    >
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
