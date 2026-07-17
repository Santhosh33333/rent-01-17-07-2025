import { Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BalanceCard } from '../../components/BalanceCard'

export function WalletPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BalanceCard label="Available Balance" amount={1250.50} icon={<Wallet className="h-6 w-6 text-blue-600" />} />
        <BalanceCard label="Pending Withdrawals" amount={300.00} icon={<Wallet className="h-6 w-6 text-yellow-600" />} />
        <BalanceCard label="Total Earnings" amount={2500.75} icon={<Wallet className="h-6 w-6 text-green-600" />} />
      </div>
      <div className="flex space-x-4">
        <Link to="/wallet/withdraw" className="btn-primary">Withdraw Funds</Link>
        <Link to="/wallet/history" className="btn-secondary">Transaction History</Link>
      </div>
    </div>
  )
}
