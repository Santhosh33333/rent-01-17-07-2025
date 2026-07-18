import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface Report {
  id: number
  reporter: string
  reportedUser: string
  reason: string
  status: 'open' | 'resolved' | 'dismissed'
  date: string
}

export function AdminReportsPage() {
  const [list, setList] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get<Report[]>('/admin/reports')
        setList(res.data)
      } catch (err) {
        setError('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const handleResolve = async (id: number) => {
    try {
      await api.post(`/admin/reports/${id}/resolve`)
      setList(list.map(r => r.id === id ? { ...r, status: 'resolved' } : r))
    } catch (err) {
      // keep UI optimistic
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.map(report => (
              <tr key={report.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.reporter}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reportedUser}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    report.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                </td>
                {report.status === 'open' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => handleResolve(report.id)} className="text-blue-600 hover:text-blue-800">Resolve</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
