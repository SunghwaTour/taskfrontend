'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, CheckSquare, FileText, Package, Settings, User } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { getCurrentUser } from '@/lib/storage'
import type { User as UserType } from '@/lib/types'

const menuItems = [
  { title: '업무', icon: ClipboardList, url: '/tasks' },
  { title: '결재', icon: CheckSquare, url: '/approvals' },
  { title: '보고서', icon: FileText, url: '/reports' },
  { title: '공지', icon: Package, url: '/patch-notes' },
  { title: '설정', icon: Settings, url: '/settings', requiresRole: ['CEO', 'TEAM_LEADER'] as const },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.requiresRole && currentUser) {
      return item.requiresRole.includes(currentUser.role)
    }
    return true
  })

  return (
    <Sidebar className="pt-14">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.url)}
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
