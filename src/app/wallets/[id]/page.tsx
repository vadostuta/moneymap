import WalletPageClient from './WalletPageClient'

export default function WalletPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return <WalletPageClient params={params} />
}
