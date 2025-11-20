'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCurrentUser, logout } from '@/lib/storage'
import { useSidebar } from '@/components/ui/sidebar'
import type { User as UserType } from '@/lib/types'

export function TopBar() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const { toggleSidebar } = useSidebar()

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!currentUser) return null

  return (
    <div className="flex h-14 w-full items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-9 w-9"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">사이드바 토글</span>
        </Button>
        <h1 className="text-lg font-semibold">Kingbus 업무관리</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-foreground">{currentUser.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <User className="h-4 w-4" />
              <span className="sr-only">사용자 메뉴</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/mypage')}>
              마이페이지
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
