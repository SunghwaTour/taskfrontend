'use client'

import { useState, useEffect } from 'react'
import { Plus, LayoutGrid, List, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { TaskCreateModal } from '@/components/task-create-modal'
import { TaskKanban } from '@/components/task-kanban'
import { TaskList } from '@/components/task-list'
import { TaskDetailModal } from '@/components/task-detail-modal'
import { getTasks } from '@/lib/storage'
import { Task } from '@/lib/types'

export default function TasksPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [tasks, setTasks] = useState<Task[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [navigationTaskId, setNavigationTaskId] = useState<string | null>(null)
  const [navigationModalOpen, setNavigationModalOpen] = useState(false)

  const loadTasks = async () => {
    try {
      const tasksList = await getTasks()
      // Ensure tasksList is always an array
      setTasks(Array.isArray(tasksList) ? tasksList : [])
    } catch (error) {
      console.error('Failed to load tasks:', error)
      setTasks([])
    }
  }

  useEffect(() => {
    loadTasks()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tasks') {
        loadTasks()
      }
    }

    // Listen for custom task update events
    const handleTaskUpdate = () => {
      loadTasks()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('taskUpdated', handleTaskUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('taskUpdated', handleTaskUpdate)
    }
  }, [])

  useEffect(() => {
    // Ensure tasks is always an array
    const tasksList = Array.isArray(tasks) ? tasks : []

    if (!searchQuery.trim()) {
      setFilteredTasks(tasksList)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = tasksList.filter((task) => {
      return (
        (task.title || '').toLowerCase().includes(query) ||
        (task.content || '').toLowerCase().includes(query) ||
        (task.category || '').toLowerCase().includes(query) ||
        (task.service || '').toLowerCase().includes(query)
      )
    })
    setFilteredTasks(filtered)
  }, [tasks, searchQuery])

  const handleTaskNavigation = (taskId: string) => {
    setNavigationTaskId(taskId)
    setNavigationModalOpen(true)
  }

  const navigationTask = navigationTaskId ? tasks.find((t) => t.id === navigationTaskId) || null : null

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">업무</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            팀 업무를 칸반 보드 또는 리스트로 관리하세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
            <TabsList>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">칸반</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">리스트</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            업무 등록
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="업무 제목, 내용, 카테고리, 서비스로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {view === 'kanban' ? (
        <TaskKanban
          tasks={Array.isArray(filteredTasks) ? filteredTasks : []}
          onTaskUpdated={loadTasks}
          onTaskClick={handleTaskNavigation}
        />
      ) : (
        <TaskList
          tasks={Array.isArray(filteredTasks) ? filteredTasks : []}
          onTaskUpdated={loadTasks}
          onTaskClick={handleTaskNavigation}
        />
      )}

      <TaskCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onTaskCreated={loadTasks}
      />

      <TaskDetailModal
        task={navigationTask}
        open={navigationModalOpen}
        onOpenChange={setNavigationModalOpen}
        onTaskUpdated={loadTasks}
        onTaskClick={handleTaskNavigation}
      />
    </div>
  )
}
