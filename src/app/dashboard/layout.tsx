import { PageContainer } from '@/components/ui/page'
export default function DashboardLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <PageContainer>
      {children}
    </PageContainer>
  )
}
