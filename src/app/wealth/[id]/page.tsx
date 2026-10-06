import SnapshotDetailClient from './SnapshotDetailClient'

export default function SnapshotDetailPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return <SnapshotDetailClient params={params} />
}
