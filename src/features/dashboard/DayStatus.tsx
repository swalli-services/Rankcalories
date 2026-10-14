import { ArrowDown, ArrowUp, Check, Clock3, Minus } from 'lucide-react'
import type { DayStatus } from './model'
import { statusLabels } from './model'
const statusIcons = {
  within: Check,
  above: ArrowUp,
  below: ArrowDown,
  ongoing: Clock3,
  empty: Minus,
}

export function StatusBadge({ status }: { status: DayStatus }) {
  const Icon = statusIcons[status]
  return (
    <span className={`day-status status-${status}`}>
      <Icon size={14} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  )
}
