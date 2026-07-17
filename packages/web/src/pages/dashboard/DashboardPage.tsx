import { Users, Calendar, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { StatCard } from '../../components/StatCard'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Trust Score" value={user?.trustScore || 0} icon={<Users className="h-6 w-6 text-blue-600" />} />
        <StatCard title="Communities" value="12" icon={<Users className="h-6 w-6 text-green-600" />} change="+2 this month" changeType="positive" />
        <StatCard title="Events" value="8" icon={<Calendar className="h-6 w-6 text-purple-600" />} />
        <StatCard title="Messages" value="24" icon={<MessageSquare className="h-6 w-6 text-yellow-600" />} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/walking-requests" className="btn-primary">Find Walking Requests</Link>
            <Link to="/walking-partner/apply" className="btn-secondary">Become a Partner</Link>
            <Link to="/communities" className="btn-secondary">Join Community</Link>
            <Link to="/events" className="btn-secondary">Browse Events</Link>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">New walking request nearby</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Community invitation received</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment processed</p>
                <p className="text-xs text-gray-500">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
