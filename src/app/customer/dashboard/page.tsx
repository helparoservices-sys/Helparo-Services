'use server'

import Link from 'next/link'

export default async function CustomerDashboard() {
  return (
    <div className="min-h-screen bg-primary-50 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Customer Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Helparo. Manage your service requests and payments.</p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/services" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">Browse Services</h3>
            <p className="text-sm text-muted-foreground">Explore available service categories</p>
          </Link>
          
          <Link href="/customer/requests/new" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">Create Request</h3>
            <p className="text-sm text-muted-foreground">Post a new service request</p>
          </Link>
          
          <Link href="/customer/requests" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">My Requests</h3>
            <p className="text-sm text-muted-foreground">View and manage your requests</p>
          </Link>
          
          <Link href="/customer/wallet" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">💰 My Wallet</h3>
            <p className="text-sm text-muted-foreground">Fund escrows and view balance</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
