import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')?.trim()
  const bookingId = url.searchParams.get('bookingId')?.trim()
  const customer = url.searchParams.get('customer')?.trim()
  const from = url.searchParams.get('from')?.trim()
  const to = url.searchParams.get('to')?.trim()

  let query = supabase
    .from('service_requests')
    .select(`
      id,title,status,estimated_price,created_at,category_id,
      profiles:profiles!service_requests_customer_id_fkey(full_name,email)
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (bookingId) query = query.ilike('id', `%${bookingId}%`)
  if (customer) query = query.ilike('profiles.full_name', `%${customer}%`)
  if (from) query = query.gte('created_at', new Date(from + 'T00:00:00Z').toISOString())
  if (to) query = query.lte('created_at', new Date(to + 'T23:59:59Z').toISOString())

  const { data, error } = await query
  if (error) {
    return new Response('Failed to export CSV', { status: 500 })
  }

  const header = ['id','title','status','estimated_price','created_at','customer_name','customer_email']
  const rows = (data || []).map((r:any) => [
    r.id,
    sanitize(r.title),
    r.status,
    r.estimated_price ?? '',
    r.created_at,
    sanitize(r.profiles?.full_name || ''),
    sanitize(r.profiles?.email || '')
  ])
  const csv = [header.join(','), ...rows.map(row => row.map(cell => wrap(cell)).join(','))].join('\n')

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bookings_export.csv"'
    }
  })
}

function sanitize(val: any) {
  if (val == null) return ''
  return String(val).replace(/\r|\n/g, ' ').trim()
}

function wrap(val: any) {
  const s = sanitize(val)
  if (s.includes(',') || s.includes('"')) {
    return '"' + s.replace(/"/g,'""') + '"'
  }
  return s
}
