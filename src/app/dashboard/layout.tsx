export default function DashboardLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className='container px-3 sm:px-4 md:px-6 ml-0 sm:ml-2 max-w-7xl py-4'>
      {children}
    </div>
  )
}
