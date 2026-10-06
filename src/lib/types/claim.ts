import { CurrencyType } from './wallet'

export interface Claim {
  id: string
  user_id: string
  name: string
  target_amount: number | null
  // Currency of target_amount; null when there is no target
  target_currency: CurrencyType | null
  // 'yyyy-MM-dd'; a claim with a target date is a goal
  target_date: string | null
  is_archived: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type CreateClaimDTO = Pick<
  Claim,
  'name' | 'target_amount' | 'target_currency' | 'target_date'
>
export type UpdateClaimDTO = Partial<
  Pick<
    Claim,
    | 'name'
    | 'target_amount'
    | 'target_currency'
    | 'target_date'
    | 'is_archived'
  >
>
