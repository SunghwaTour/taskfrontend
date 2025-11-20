'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Report, ReportType } from '@/lib/types'
import { addReport, getCurrentUser } from '@/lib/storage'
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentUser = getCurrentUser()

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

    setIsSubmitting(true)
    try {
      const newReport: Report = {
        id: Date.now().toString(),
        type: reportType,
        year: selectedYear,
        ...(reportType === 'WEEKLY'
          ? { weekNumber: selectedWeek }
          : { month: selectedMonth }),
        tasks: [],
        content,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      }

      await addReport(newReport)
      onReportCreated?.()
      handleClose()
    } catch (error) {
      console.error('Failed to create report:', error)
      alert('보고서 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setContent('')
    setIsSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>보고서 작성</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-[1fr_300px] gap-6 p-1">
              {/* Left Column - Editor */}
              <div className="space-y-4">
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="보고서 내용을 작성하세요..."
                  className="h-[500px]"
                />
              </div>

              {/* Right Column - Settings */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reportType">보고서 유형</Label>
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
                    <Label htmlFor="week">주차 선택</Label>
                    <Select
                      value={`${selectedYear}-W${selectedWeek}`}
                      onValueChange={(v) => {
                        const [year, week] = v.split('-W')
                        setSelectedYear(year)
                        setSelectedWeek(week)
                      }}
                    >
                      <SelectTrigger id="week">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWeeks.map((week) => (
                          <SelectItem
                            key={week.value}
                            value={`${week.year}-W${week.weekNumber}`}
                          >
                            {week.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="month">월 선택</Label>
                    <Select
                      value={`${selectedYear}-${selectedMonth}`}
                      onValueChange={(v) => {
                        const [year, month] = v.split('-')
                        setSelectedYear(year)
                        setSelectedMonth(month)
                      }}
                    >
                      <SelectTrigger id="month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonths.map((month) => (
                          <SelectItem
                            key={month.value}
                            value={`${month.year}-${month.month}`}
                          >
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="rounded-md bg-muted p-4">
                  <h4 className="text-sm font-medium mb-2">작성 가이드</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 주요 업무 내용</li>
                    <li>• 완료된 작업</li>
                    <li>• 진행 중인 작업</li>
                    <li>• 이슈 및 개선사항</li>
                    <li>• 다음 주 계획</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? '작성 중...' : '작성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
