import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShieldCheck, Handshake,
  Banknote, Flag, ScrollText, ArrowLeft
} from 'lucide-react'

export function AdminPortalPage() {
  const sections = [
    { path: '/admin/dashboard', title: 'Dashboard', desc: 'Overview & analytics', icon: LayoutDashboard },
    { path: '/admin/users', title: 'Users', desc: 'Manage user accounts', icon: Users },
    { path: '/admin/kyc', title: 'KYC Verification', desc: 'Review identity documents', icon: ShieldCheck },
    { path: '/admin/partners', title: 'Partners', desc: 'Approve & manage partners', icon: Handshake },
    { path: '/admin/withdrawals', title: 'Withdrawals', desc: 'Review withdrawal requests', icon: Banknote },
    { path: '/admin/reports', title: 'Reports', desc: 'Review user reports', icon: Flag },
    { path: '/admin/audit-logs', title: 'Audit Logs', desc: 'System activity logs', icon: ScrollText },
  ]

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your RentBuddy platform</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-700 group-hover:bg-gray-600 flex items-center justify-center mb-3 transition">
                <s.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">{s.title}</h2>
              <p className="text-gray-400 text-sm mt-1">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
