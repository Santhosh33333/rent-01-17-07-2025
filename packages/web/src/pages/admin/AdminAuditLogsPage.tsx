import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '../../lib/api'

interface AuditLog {
  id: string
  actorId: string
  action: string
  entityType: string
  entityId: string
  details?: string
  createdAt: string
}

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.getAuditLogs({ page })
      const d = res.data?.data || res.data
      setLogs(Array.isArray(d?.logs) ? d.logs : Array.isArray(d) ? d : [])
      setTotalPages(d?.totalPages || 1)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  const actionBadge = (action: string) => {
    const map: Record<string, string> = {
      CREATE: 'bg-emerald-900/30 text-emerald-400',
      UPDATE: 'bg-blue-900/30 text-blue-400',
      DELETE: 'bg-red-900/30 text-red-400',
      APPROVE: 'bg-emerald-900/30 text-emerald-400',
      REJECT: 'bg-red-900/30 text-red-400',
      LOGIN: 'bg-cyan-900/30 text-cyan-400',
    }
    return map[action] || 'bg-gray-700 text-gray-400'
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/portal" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
            <p className="text-gray-400 text-sm mt-1">System activity logs</p>
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
            <p className="text-gray-400 mt-4">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Actor ID</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Action</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Entity Type</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Entity ID</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-700/50 last:border-0">
                        <td className="px-4 py-3">
                          <span className="text-white text-xs font-mono">{log.actorId || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${actionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{log.entityType || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 text-xs font-mono">{log.entityId || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-500 text-xs">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </span>
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
