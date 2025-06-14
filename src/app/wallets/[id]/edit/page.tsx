import EditWalletPageClient from './EditWalletPageClient'

export default function EditWalletPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return <EditWalletPageClient params={params} />
}
