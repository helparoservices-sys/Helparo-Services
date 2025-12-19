'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading'

interface UserContextType {
  userId: string | null
  role: string | null
}

const UserContext = createContext<UserContextType>({ userId: null, role: null })

export function useUser() {
  return useContext(UserContext)
}

interface RoleGuardProps {
  children: React.ReactNode
  allowedRole: 'admin' | 'helper' | 'customer'
}

export function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    checkRole()
  }, [])

  const checkRole = async () => {
    const supabase = createClient()
    
    // Use getSession for faster initial check (cached), then validate with getUser
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    const user = session.user
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role
    setRole(userRole)

    if (userRole !== allowedRole) {
      // Redirect to correct dashboard
      router.push(`/${userRole}/dashboard`)
      return
    }

    setAuthorized(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <UserContext.Provider value={{ userId, role }}>
      {children}
    </UserContext.Provider>
  )
}
