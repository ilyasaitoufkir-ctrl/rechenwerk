import { useMemo, useState, type ReactNode } from 'react'
import { TransferContext, type TransferItem, type TransferContextValue } from './transferContext'

export function TransferProvider({ children }: { children: ReactNode }) {
  const [transfer, setTransferState] = useState<TransferItem | null>(null)

  const value = useMemo<TransferContextValue>(
    () => ({
      transfer,
      setTransfer: (item) => setTransferState(item),
      clearTransfer: () => setTransferState(null),
    }),
    [transfer],
  )

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}
