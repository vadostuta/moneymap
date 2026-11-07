import { PageContainer } from '@/components/ui/page'
export default function PlanLayout ({
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
