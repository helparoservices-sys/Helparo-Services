'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginDebugPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      let profile = null
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        profile = data
      }
      
      setStatus({
        session: !!session,
        user: user,
        profile: profile,
        sessionDetails: session
      })
      
    } catch (error: any) {
      setStatus({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function testLogin() {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test.admin@helparo.com',
        password: 'Test@123456'
      })
      
      if (error) throw error
      
      console.log('Login successful:', data)
      alert('Login successful! Refreshing...')
      await checkAuth()
      
      // Try redirect
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        const role = (profile as any)?.role || 'customer'
        console.log('Redirecting to:', `/${role}/dashboard`)
        window.location.href = `/${role}/dashboard`
      }
      
    } catch (error: any) {
      console.error('Login error:', error)
      alert('Login failed: ' + error.message)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    await checkAuth()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Login Debug Page</h1>
        
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Authentication Status</h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${status?.session ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Session Active: {status?.session ? 'Yes' : 'No'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${status?.user ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>User Logged In: {status?.user ? 'Yes' : 'No'}</span>
            </div>
            
            {status?.user && (
              <div className="ml-5 space-y-1">
                <p className="text-sm"><strong>User ID:</strong> {status.user.id}</p>
                <p className="text-sm"><strong>Email:</strong> {status.user.email}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${status?.profile ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Profile Found: {status?.profile ? 'Yes' : 'No'}</span>
            </div>
            
            {status?.profile && (
              <div className="ml-5 space-y-1">
                <p className="text-sm"><strong>Full Name:</strong> {status.profile.full_name}</p>
                <p className="text-sm"><strong>Role:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{status.profile.role}</span></p>
                <p className="text-sm"><strong>Phone:</strong> {status.profile.phone_number || 'Not set'}</p>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t space-y-2">
            <h3 className="font-semibold">Actions</h3>
            <div className="flex gap-2">
              <button
                onClick={testLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test Login (test.admin@helparo.com)
              </button>
              
              {status?.user && (
                <>
                  <button
                    onClick={() => window.location.href = `/${status.profile?.role}/dashboard`}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Go to Dashboard
                  </button>
                  
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              )}
              
              <button
                onClick={checkAuth}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Data (Debug)</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Expected Redirect URLs:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Admin: <code className="bg-yellow-100 px-2 py-1 rounded">/admin/dashboard</code></li>
            <li>• Helper: <code className="bg-yellow-100 px-2 py-1 rounded">/helper/dashboard</code></li>
            <li>• Customer: <code className="bg-yellow-100 px-2 py-1 rounded">/customer/dashboard</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
