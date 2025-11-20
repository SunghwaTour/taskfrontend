'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Report, ReportType, Task } from '@/lib/types'
import { addReport, getTasks, getCurrentUser } from '@/lib/storage'
import {
  getAvailableWeeks,
  getAvailableMonths,
  getCurrentWeek,
} from '@/lib/utils/date'

interface ReportCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReportCreated?: () => void
}

export function ReportCreateModal({
  open,
  onOpenChange,
  onReportCreated,
}: ReportCreateModalProps) {
  const [reportType, setReportType] = useState<ReportType>('WEEKLY')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [content, setContent] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])

  const currentUser = getCurrentUser()

  useEffect(() => {
    const loadTasks = async () => {
      const tasksList = await getTasks()
      setAllTasks(Array.isArray(tasksList) ? tasksList : [])
    }

    if (open) {
      loadTasks()
    }
  }, [open])

  // Filter tasks where current user is CC'd or is the creator
  const userTasks = allTasks.filter(
    (task) =>
      currentUser &&
      (task.cc.includes(currentUser.id) || task.createdBy === currentUser.id)
  )

  const availableWeeks = getAvailableWeeks()
  const availableMonths = getAvailableMonths()

  useEffect(() => {
    if (open && reportType === 'WEEKLY') {
      const currentWeek = getCurrentWeek()
      setSelectedYear(currentWeek.year.toString())
      setSelectedWeek(currentWeek.weekNumber.toString())
    } else if (open && reportType === 'MONTHLY') {
      const today = new Date()
      setSelectedYear(today.getFullYear().toString())
      setSelectedMonth((today.getMonth() + 1).toString())
    }
  }, [open, reportType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) return

    try {
      const newReport: Report = {
        id: Date.now().toString(),
        type: reportType,
        year: selectedYear,
        ...(reportType === 'WEEKLY'
          ? { weekNumber: selectedWeek }
          : { month: selectedMonth }),
        tasks: selectedTasks,
        content,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      }

      await addReport(newReport)
      onReportCreated?.()
      handleClose()
    } catch (error) {
      console.error('Failed to create report:', error)
    }
  }

  const handleClose = () => {
    setContent('')
    setSelectedTasks([])
    onOpenChange(false)
  }

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>보고서 작성</DialogTitle>
          <DialogDescription>주간 또는 월간 보고서를 작성하세요</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reportType">보고서 유형 *</Label>
            <Select
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
            >
              <SelectTrigger id="reportType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">주간 보고서</SelectItem>
                <SelectItem value="MONTHLY">월간 보고서</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'WEEKLY' ? (
            <div className="space-y-2">
              <Label htmlFor="week">주차 선택 *</Label>
              <Select
                value={`${selectedYear}-${selectedWeek}`}
                onValueChange={(v) => {
                  const [year, week] = v.split('-')
                  setSelectedYear(year)
                  setSelectedWeek(week)
                }}
              >
                <SelectTrigger id="week">
                  <SelectValue placeholder="주차를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map((week) => (
                    <SelectItem
                      key={`${week.year}-${week.weekNumber}`}
                      value={`${week.year}-${week.weekNumber}`}
                    >
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="month">월 선택 *</Label>
              <Select
                value={`${selectedYear}-${selectedMonth}`}
                onValueChange={(v) => {
                  const [year, month] = v.split('-')
                  setSelectedYear(year)
                  setSelectedMonth(month)
                }}
              >
                <SelectTrigger id="month">
                  <SelectValue placeholder="월을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem
                      key={`${month.year}-${month.month}`}
                      value={`${month.year}-${month.month}`}
                    >
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>관련 업무 선택</Label>
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border border-input p-3">
              {userTasks.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  참조되거나 작성한 업무가 없습니다.
                </p>
              ) : (
                userTasks.map((task) => (
                  <div key={task.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {task.category} · {task.service}
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">보고서 내용 *</Label>
            <Textarea
              id="content"
              placeholder="보고서 내용을 작성하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit">작성 완료</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
