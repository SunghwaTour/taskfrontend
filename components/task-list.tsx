'use client'

import { useState, useEffect } from 'react'
import { Task, User } from '@/lib/types'
import { getUsers } from '@/lib/storage'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TaskDetailModal } from './task-detail-modal'

interface TaskListProps {
  tasks: Task[]
  onTaskUpdated: () => void
  onTaskClick?: (taskId: string) => void
}

export function TaskList({ tasks, onTaskUpdated, onTaskClick }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  // Ensure tasks is always an array
  const tasksList = Array.isArray(tasks) ? tasks : []

  useEffect(() => {
    const loadUsers = async () => {
      const usersList = await getUsers()
      setUsers(usersList)
    }
    loadUsers()
  }, [])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDetailModalOpen(true)
  }

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || '알 수 없음'
  }

  const statusLabels = {
    BACKLOG: '백로그',
    TODO: '계획',
    DOING: '진행중',
    DONE: '완료',
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>서비스</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>마감일</TableHead>
              <TableHead>작성자</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  등록된 업무가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              tasksList.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{task.service}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{statusLabels[task.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {task.assignees.map(getUserName).join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-sm">{task.dueDate || '-'}</TableCell>
                  <TableCell className="text-sm">{getUserName(task.createdBy)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onTaskUpdated={onTaskUpdated}
        onTaskClick={onTaskClick}
      />
    </>
  )
}
