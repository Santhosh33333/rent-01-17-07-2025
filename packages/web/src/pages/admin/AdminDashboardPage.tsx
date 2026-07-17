import { Users, Wallet, AlertTriangle, UserCheck } from 'lucide-react'
import { StatCard } from '../../components/StatCard'

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value="1,234" icon={<Users className="h-6 w-6 text-blue-600" />} change="+12 this week" changeType="positive" />
        <StatCard title="Pending KYC" value="45" icon={<UserCheck className="h-6 w-6 text-yellow-600" />} />
        <StatCard title="Pending Withdrawals" value="$12,450" icon={<Wallet className="h-6 w-6 text-green-600" />} />
        <StatCard title="Open Reports" value="8" icon={<AlertTriangle className="h-6 w-6 text-red-600" />} />
      </div>
    </div>
  )
}
