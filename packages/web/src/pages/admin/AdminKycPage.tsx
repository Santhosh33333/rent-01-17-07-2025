import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { adminApi } from '../../lib/api'

interface KycEntry {
  id: string
  userId: string
  userName: string
  userEmail: string
  selfieUrl?: string
  govIdUrl?: string
  govIdType?: string
  status: string
  createdAt: string
}

export function AdminKycPage() {
  const [entries, setEntries] = useState<KycEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchKyc = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = { page }
      if (statusFilter) params.status = statusFilter
      const res = await adminApi.getKycQueue(params)
      const d = res.data?.data || res.data
      setEntries(Array.isArray(d?.entries) ? d.entries : Array.isArray(d) ? d : [])
      setTotalPages(d?.totalPages || 1)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load KYC queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKyc()
  }, [page, statusFilter])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      await adminApi.approveKyc(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return
    setActionLoading(id)
    try {
      await adminApi.rejectKyc(id, { reason: rejectReason })
      setEntries((prev) => prev.filter((e) => e.id !== id))
      setRejectId(null)
      setRejectReason('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-900/30 text-amber-400',
      APPROVED: 'bg-emerald-900/30 text-emerald-400',
      REJECTED: 'bg-red-900/30 text-red-400',
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
            <h1 className="text-2xl font-bold text-white">KYC Verification</h1>
            <p className="text-gray-400 text-sm mt-1">Review identity documents</p>
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
            <p className="text-gray-400 mt-4">Loading KYC queue...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No KYC entries found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-gray-800 rounded-xl overflow-hidden">
                  <div
                    className="p-4 hover:bg-gray-750 cursor-pointer transition"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white">
                          {entry.userName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{entry.userName || 'Unknown'}</p>
                          <p className="text-gray-500 text-xs">{entry.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-xs hidden sm:block">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN') : '-'}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {expandedId === entry.id && (
                    <div className="p-4 border-t border-gray-700/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {entry.selfieUrl && (
                          <div>
                            <p className="text-gray-400 text-xs font-medium mb-2">Selfie</p>
                            <img src={entry.selfieUrl} alt="Selfie" className="w-full h-48 object-cover rounded-lg bg-gray-700" />
                          </div>
                        )}
                        {entry.govIdUrl && (
                          <div>
                            <p className="text-gray-400 text-xs font-medium mb-2">
                              Government ID {entry.govIdType ? `(${entry.govIdType})` : ''}
                            </p>
                            <img src={entry.govIdUrl} alt="Gov ID" className="w-full h-48 object-cover rounded-lg bg-gray-700" />
                          </div>
                        )}
                        {!entry.selfieUrl && !entry.govIdUrl && (
                          <p className="text-gray-500 text-sm">No documents uploaded</p>
                        )}
                      </div>

                      {entry.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(entry.id) }}
                            disabled={actionLoading === entry.id}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                          >
                            <Check className="w-4 h-4" />
                            {actionLoading === entry.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRejectId(rejectId === entry.id ? null : entry.id) }}
                            disabled={actionLoading === entry.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}

                      {rejectId === entry.id && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="Rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleReject(entry.id)}
                            disabled={!rejectReason.trim() || actionLoading === entry.id}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                          >
                            Confirm
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
