// Quick test script to verify login
// Run with: node test-login.js

const fetch = require('node-fetch')

const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

async function testLogin() {
  console.log('Testing login with test.admin@helparo.com...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'test.admin@helparo.com',
        password: 'Test@123456'
      })
    })
    
    const data = await response.json()
    
    if (data.access_token) {
      console.log('✅ Login successful!')
      console.log('User ID:', data.user.id)
      
      // Check profile
      const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.user.id}&select=role`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${data.access_token}`
        }
      })
      
      const profile = await profileResponse.json()
      console.log('Profile:', profile)
      console.log('Role:', profile[0]?.role)
      
    } else {
      console.log('❌ Login failed:', data)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testLogin()
