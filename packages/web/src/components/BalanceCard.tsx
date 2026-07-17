interface BalanceCardProps {
  label: string
  amount: number
  currency?: string
  icon?: React.ReactNode
}

export function BalanceCard({ label, amount, currency = '$', icon }: BalanceCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {currency}{amount.toFixed(2)}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
