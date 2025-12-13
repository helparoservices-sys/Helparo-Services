const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://xjexgskmyytcjlgkfxen.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZXhnc2tteXl0Y2psZ2tmeGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTM1NzMsImV4cCI6MjA2MzQ4OTU3M30.FuMSdMJ5Jj8JMCW7Pw9sJKHRf7v4wdjCSINunrqHSH0'
)

async function checkCancelledJobs() {
  const { data, error } = await supabase
    .from('service_requests')
    .select('id, status, assigned_helper_id, title, broadcast_status')
    .eq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log('Cancelled jobs:')
  console.log(JSON.stringify(data, null, 2))
  if (error) console.log('Error:', error)
}

checkCancelledJobs()
