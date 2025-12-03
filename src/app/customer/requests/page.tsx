'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerRequestsList() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to bookings page
    router.replace('/customer/bookings')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Redirecting to bookings...</p>
      </div>
    </div>
  )
}
