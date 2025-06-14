import WalletsLayoutClient from './WalletsLayoutClient'

export default function WalletsLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return <WalletsLayoutClient>{children}</WalletsLayoutClient>
}
