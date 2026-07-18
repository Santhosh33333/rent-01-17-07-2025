import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { api } from '../../lib/api'

interface User {
  id: string
  fullName: string
  email: string
  phone: string
  status: string
  role: string
  createdAt: string
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users')
        const result = response.data
        if (result.success) {
          setUsers(result.data.items)
        } else {
          setError(result.error || 'Failed to fetch users')
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filtered = users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="input rounded-md pl-10"
          />
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role.toLowerCase().replace('_', ' ')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
