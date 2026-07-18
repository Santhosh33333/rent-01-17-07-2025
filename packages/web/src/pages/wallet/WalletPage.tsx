import { useState, useEffect } from 'react'
import { Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BalanceCard } from '../../components/BalanceCard'
import { api } from '../../lib/api'

interface WalletData {
  availableBalance: number
  pendingWithdrawals: number
  totalEarnings: number
}

export function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get<WalletData>('/wallet')
        setWallet(res.data)
      } catch (err) {
        setError('Failed to load wallet data')
      } finally {
        setLoading(false)
      }
    }
    fetchWallet()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>
  if (!wallet) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BalanceCard label="Available Balance" amount={wallet.availableBalance} icon={<Wallet className="h-6 w-6 text-blue-600" />} />
        <BalanceCard label="Pending Withdrawals" amount={wallet.pendingWithdrawals} icon={<Wallet className="h-6 w-6 text-yellow-600" />} />
        <BalanceCard label="Total Earnings" amount={wallet.totalEarnings} icon={<Wallet className="h-6 w-6 text-green-600" />} />
      </div>
      <div className="flex space-x-4">
        <Link to="/wallet/withdraw" className="btn-primary">Withdraw Funds</Link>
        <Link to="/wallet/history" className="btn-secondary">Transaction History</Link>
      </div>
    </div>
  )
}
