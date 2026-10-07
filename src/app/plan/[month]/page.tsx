import MonthPlanClient from './MonthPlanClient'

export default function MonthPlanPage ({
  params
}: {
  params: Promise<{ month: string }>
}) {
  return <MonthPlanClient params={params} />
}
