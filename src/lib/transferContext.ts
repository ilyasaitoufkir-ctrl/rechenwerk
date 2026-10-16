import { createContext } from 'react'
import type { DimensionId } from '../units'

export interface TransferItem {
  dimension: DimensionId
  wertSI: number
  herkunft: string
}

export interface TransferContextValue {
  transfer: TransferItem | null
  setTransfer: (item: TransferItem) => void
  clearTransfer: () => void
}

export const TransferContext = createContext<TransferContextValue | null>(null)
