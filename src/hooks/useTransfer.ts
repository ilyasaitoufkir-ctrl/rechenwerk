import { useContext } from 'react'
import { TransferContext, type TransferContextValue } from '../lib/transferContext'

export function useTransfer(): TransferContextValue {
  const ctx = useContext(TransferContext)
  if (!ctx) throw new Error('useTransfer muss innerhalb von TransferProvider verwendet werden')
  return ctx
}
