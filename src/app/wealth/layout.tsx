import { PageContainer } from '@/components/ui/page'
export default function WealthLayout ({
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
