import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface VerificationBadgeProps {
  status: 'verified' | 'pending' | 'not-started'
  label?: string
}

export function VerificationBadge({ status, label }: VerificationBadgeProps) {
  const config = {
    verified: { icon: CheckCircle, color: 'text-green-600 bg-green-50', text: 'Verified' },
    pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', text: 'Pending' },
    'not-started': { icon: XCircle, color: 'text-gray-600 bg-gray-50', text: 'Not Started' },
  }[status]

  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label || config.text}
    </span>
  )
}
