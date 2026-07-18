import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface AuditLog {
  id: number
  action: string
  user: string
  timestamp: string
  details: string
}

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get<AuditLog[]>('/admin/audit-logs')
        setLogs(res.data)
      } catch (err) {
        setError('Failed to load audit logs')
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map(log => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
