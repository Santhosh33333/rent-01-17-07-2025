interface AuditLog {
  id: number
  action: string
  user: string
  timestamp: string
  details: string
}

const logs: AuditLog[] = [
  { id: 1, action: 'USER_LOGIN', user: 'Alice Johnson', timestamp: '2025-01-15T10:30:00Z', details: 'Successful login' },
  { id: 2, action: 'USER_UPDATE', user: 'Bob Smith', timestamp: '2025-01-15T09:15:00Z', details: 'Profile updated' },
  { id: 3, action: 'WITHDRAWAL_APPROVED', user: 'Admin', timestamp: '2025-01-14T16:45:00Z', details: 'Withdrawal #123 approved' },
  { id: 4, action: 'KYC_REJECTED', user: 'Admin', timestamp: '2025-01-14T14:20:00Z', details: 'KYC request #456 rejected' },
]

export function AdminAuditLogsPage() {
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
