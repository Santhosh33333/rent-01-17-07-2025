import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '../../lib/api'

interface User {
  id: string
  name: string
  email: string
  phone: string
  status: string
  createdAt: string
  role?: string
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = { page }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await adminApi.getUsers(params)
      const d = res.data?.data || res.data
      setUsers(Array.isArray(d?.users) ? d.users : Array.isArray(d) ? d : [])
      setTotalPages(d?.totalPages || d?.totalPages || 1)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-emerald-900/30 text-emerald-400',
      PENDING: 'bg-amber-900/30 text-amber-400',
      BANNED: 'bg-red-900/30 text-red-400',
      INACTIVE: 'bg-gray-700 text-gray-400',
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
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="text-gray-400 text-sm mt-1">Manage user accounts</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition">
              Search
            </button>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="BANNED">Banned</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin mx-auto" />
            <p className="text-gray-400 mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Name</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Email</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Phone</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Status</th>
                      <th className="px-4 py-3 text-gray-400 text-xs font-medium uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700/50 last:border-0">
                        <td colSpan={5}>
                          <div
                            className="px-4 py-3 hover:bg-gray-700/30 cursor-pointer transition"
                            onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white">
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="text-white text-sm font-medium">{user.name || 'Unknown'}</p>
                                  <p className="text-gray-500 text-xs">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="hidden sm:block text-gray-400 text-xs">{user.phone || '-'}</span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(user.status)}`}>
                                  {user.status}
                                </span>
                                <span className="text-gray-500 text-xs hidden sm:block">
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {expandedId === user.id && (
                            <div className="px-4 pb-3 pt-1 border-t border-gray-700/50">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs">User ID</p>
                                  <p className="text-white font-mono text-xs">{user.id}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Role</p>
                                  <p className="text-white">{user.role || 'USER'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Phone</p>
                                  <p className="text-white">{user.phone || 'Not provided'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Joined</p>
                                  <p className="text-white">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                                </div>
                              </div>
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
