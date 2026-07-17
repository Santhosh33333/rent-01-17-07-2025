import { useState } from 'react'

interface Report {
  id: number
  reporter: string
  reportedUser: string
  reason: string
  status: 'open' | 'resolved' | 'dismissed'
  date: string
}

const reports: Report[] = [
  { id: 1, reporter: 'Alice Johnson', reportedUser: 'Bob Smith', reason: 'Inappropriate behavior', status: 'open', date: '2025-01-15' },
  { id: 2, reporter: 'Carol White', reportedUser: 'Dave Brown', reason: 'No show', status: 'resolved', date: '2025-01-14' },
]

export function AdminReportsPage() {
  const [list, setList] = useState(reports)

  const handleResolve = (id: number) => {
    setList(list.map(r => r.id === id ? { ...r, status: 'resolved' } : r))
  }

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
