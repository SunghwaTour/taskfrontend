'use client'

import { useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Task, TaskCategory, ServiceType, User } from '@/lib/types'
import { addTask, getCurrentUser, getUsers, getServices, uploadTaskFile } from '@/lib/storage'

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
  const [selectedAssignees, setSelectedAssignees] = useState<User[]>([])
  const [selectedCC, setSelectedCC] = useState<User[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [ccSearch, setCCSearch] = useState('')

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [services, setServices] = useState<ServiceType[]>([])

  useEffect(() => {
    const loadData = async () => {
      const user = getCurrentUser()
      const usersList = await getUsers()
      const servicesList = await getServices()

      setCurrentUser(user)
      setUsers(Array.isArray(usersList) ? usersList.filter(u => u.role !== 'VISITOR') : [])
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
      const newTask = await addTask({
        title,
        category,
        relatedTasks: [],
        service,
        startDate: startDate || null,
        dueDate: dueDate || null,
        content,
        files: [],
        assignees: selectedAssignees.map(u => u.id),
        cc: selectedCC.map(u => u.id),
        status: 'BACKLOG',
        updatedAt: new Date().toISOString(),
        comments: [],
      })

      if (!newTask) {
        alert('업무 등록에 실패했습니다.')
        setUploading(false)
        return
      }

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await uploadTaskFile(newTask.id, file, file.name, '기타')
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
    setSelectedFiles([])
    setAssigneeSearch('')
    setCCSearch('')
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

  const addAssignee = (user: User) => {
    if (!selectedAssignees.find(u => u.id === user.id)) {
      setSelectedAssignees([...selectedAssignees, user])
    }
    setAssigneeSearch('')
  }

  const removeAssignee = (userId: string) => {
    setSelectedAssignees(selectedAssignees.filter(u => u.id !== userId))
  }

  const addCC = (user: User) => {
    if (!selectedCC.find(u => u.id === user.id)) {
      setSelectedCC([...selectedCC, user])
    }
    setCCSearch('')
  }

  const removeCC = (userId: string) => {
    setSelectedCC(selectedCC.filter(u => u.id !== userId))
  }

  const filteredAssigneeUsers = users.filter(u =>
    u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) &&
    !selectedAssignees.find(s => s.id === u.id)
  )

  const filteredCCUsers = users.filter(u =>
    u.name.toLowerCase().includes(ccSearch.toLowerCase()) &&
    !selectedCC.find(s => s.id === u.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>새 글 작성</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-1">
              {/* Left Column - Title & Editor */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">제목을 입력하세요</Label>
                  <Input
                    id="title"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="text-lg font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="내용을 입력하세요..."
                  />
                </div>
              </div>

              {/* Right Column - Settings */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="카테고리 선택" />
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
                  <Label htmlFor="service">서비스 선택</Label>
                  <Select value={service} onValueChange={(v) => setService(v as ServiceType)}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="서비스 선택" />
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

                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="날짜를 선택하세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">마감일</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="날짜를 선택하세요"
                  />
                </div>

                {/* Assignees */}
                <div className="space-y-2">
                  <Label>담당자 지정</Label>
                  <div className="relative">
                    <Input
                      placeholder="담당자 이름 검색"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                    />
                    {assigneeSearch && filteredAssigneeUsers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredAssigneeUsers.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addAssignee(user)}
                            className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                          >
                            {user.name} ({user.role})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAssignees.map(user => (
                      <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                        {user.name}
                        <button
                          type="button"
                          onClick={() => removeAssignee(user.id)}
                          className="ml-1 rounded-sm hover:bg-secondary-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* CC */}
                <div className="space-y-2">
                  <Label>참조자 지정</Label>
                  <div className="relative">
                    <Input
                      placeholder="참조자 이름 검색"
                      value={ccSearch}
                      onChange={(e) => setCCSearch(e.target.value)}
                    />
                    {ccSearch && filteredCCUsers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredCCUsers.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addCC(user)}
                            className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                          >
                            {user.name} ({user.role})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCC.map(user => (
                      <Badge key={user.id} variant="outline" className="gap-1 pr-1">
                        {user.name}
                        <button
                          type="button"
                          onClick={() => removeCC(user.id)}
                          className="ml-1 rounded-sm hover:bg-accent"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>첨부 파일</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        파일 선택 또는 드래그 앤 드롭
                      </p>
                    </label>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2"
                        >
                          <span className="text-sm truncate">{file.name}</span>
                          <X
                            className="h-4 w-4 cursor-pointer flex-shrink-0"
                            onClick={() => removeFile(index)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={uploading || !title.trim()}>
              {uploading ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
