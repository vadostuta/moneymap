import EditSnapshotClient from './EditSnapshotClient'

export default function EditSnapshotPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return <EditSnapshotClient params={params} />
}
