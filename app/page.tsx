'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/login-form'
import { getCurrentUser } from '@/lib/storage'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    console.log('Login page - current user:', user)
    if (user) {
      console.log('User already logged in, redirecting to /tasks')
      router.push('/tasks')
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
    </main>
  )
}
