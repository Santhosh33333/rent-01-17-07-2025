import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { adminApi } from '../../lib/api'

interface Withdrawal {
  id: string
  userId: string
  userName: string
  amount: number
  status: string
  upiId?: string
  bankAccount?: string
  createdAt: string
}

export function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchWithdrawals = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = { page }
      if (statusFilter) params.status = statusFilter
      const res = await adminApi.getWithdrawals(params)
      const d = res.data?.data || res.data
      setWithdrawals(Array.isArray(d?.withdrawals) ? d.withdrawals : Array.isArray(d) ? d : [])
      setTotalPages(d?.totalPages || 1)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load withdrawals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [page, statusFilter])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      await adminApi.approveWithdrawal(id)
      setWithdrawals((prev) => prev.map((w) => w.id === id ? { ...w, status: 'APPROVED' } : w))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve withdrawal')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    try {
      await adminApi.rejectWithdrawal(id, 'Rejected by admin')
      setWithdrawals((prev) => prev.map((w) => w.id === id ? { ...w, status: 'REJECTED' } : w))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject withdrawal')
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-900/30 text-amber-400',
      APPROVED: 'bg-emerald-900/30 text-emerald-400',
      REJECTED: 'bg-red-900/30 text-red-400',
      COMPLETED: 'bg-emerald-900/30 text-emerald-400',
    }
    return map[status] || 'bg-gray-700 text-gray-400'
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/portal" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
            <p className="text-gray-400 text-sm mt-1">Review withdrawal requests</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin mx-auto" />
            <p className="text-gray-400 mt-4">Loading withdrawals...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No withdrawal requests found</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">User</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Amount</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Status</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Date</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-gray-700/50 last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">{w.userName || 'Unknown'}</p>
                          {w.upiId && <p className="text-gray-500 text-xs">UPI: {w.upiId}</p>}
                          {w.bankAccount && <p className="text-gray-500 text-xs">Bank: {w.bankAccount}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white font-semibold">₹{(w.amount || 0).toLocaleString('en-IN')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(w.status)}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 text-xs">
                            {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN') : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {w.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(w.id)}
                                disabled={actionLoading === w.id}
                                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-400 rounded-lg transition"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(w.id)}
                                disabled={actionLoading === w.id}
                                className="p-1.5 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 rounded-lg transition"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-gray-500 text-sm">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-400 hover:text-white transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-400 hover:text-white transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
