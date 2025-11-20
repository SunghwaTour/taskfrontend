'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { TopBar } from '@/components/top-bar'
import { getCurrentUser } from '@/lib/storage'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    console.log('Dashboard layout - current user:', user)
    if (!user) {
      console.log('No user found, redirecting to login')
      router.push('/')
    }
  }, [router])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <div className="relative z-20">
          <TopBar />
        </div>
        <div className="relative z-10 flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
