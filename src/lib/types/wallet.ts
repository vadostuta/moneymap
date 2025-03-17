export type WalletType = 'cash' | 'bank' | 'crypto' | 'savings' | 'investment'
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'PLN'

export interface Wallet {
  id: string
  user_id: string
  name: string
  type: WalletType
  balance: number
  currency: Currency
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type CreateWalletDTO = Omit<
  Wallet,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
export type UpdateWalletDTO = Partial<CreateWalletDTO>
