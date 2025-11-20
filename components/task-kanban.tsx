'use client'

import { useState, useEffect } from 'react'
import { Task, TaskStatus, User } from '@/lib/types'
import { updateTask, getUsers } from '@/lib/storage'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, User as UserIcon } from 'lucide-react'
import { TaskDetailModal } from './task-detail-modal'
import { ApprovalCreateModal } from './approval-create-modal'

interface TaskKanbanProps {
  tasks: Task[]
  onTaskUpdated: () => void
  onTaskClick?: (taskId: string) => void
}

export function TaskKanban({ tasks, onTaskUpdated, onTaskClick }: TaskKanbanProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null)
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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const task = tasksList.find((t) => t.id === taskId)

    if (task) {
      if (targetStatus === 'DONE' && task.status !== 'DONE') {
        setTaskToComplete(task)
        setApprovalModalOpen(true)
      } else {
        updateTask(taskId, { status: targetStatus })
        onTaskUpdated()
      }
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDetailModalOpen(true)
  }

  const handleApprovalCreated = (taskId: string) => {
    updateTask(taskId, { status: 'DONE' })
    setTaskToComplete(null)
    onTaskUpdated()
  }

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || '알 수 없음'
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {statusColumns.map((column) => {
          const columnTasks = tasksList.filter((task) => task.status === column.status)

          return (
            <div
              key={column.status}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="rounded-full">
                  {columnTasks.length}
                </Badge>
              </div>

              <div className={`min-h-[500px] space-y-3 rounded-lg ${column.color} p-3`}>
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => handleTaskClick(task)}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="flex-1 font-medium text-sm leading-tight">{task.title}</h4>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {task.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {task.service}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {task.assignees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            <span>{task.assignees.map(getUserName).join(', ')}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onTaskUpdated={onTaskUpdated}
        onTaskClick={onTaskClick}
      />

      <ApprovalCreateModal
        task={taskToComplete}
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        onApprovalCreated={handleApprovalCreated}
      />
    </>
  )
}

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'BACKLOG', label: '백로그', color: 'bg-muted' },
  { status: 'TODO', label: '계획', color: 'bg-blue-500/10' },
  { status: 'DOING', label: '진행중', color: 'bg-yellow-500/10' },
  { status: 'DONE', label: '완료', color: 'bg-green-500/10' },
]
