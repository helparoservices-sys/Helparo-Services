import CustomerLayout from '@/components/customer/layout/CustomerLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CustomerLayout>{children}</CustomerLayout>
}
