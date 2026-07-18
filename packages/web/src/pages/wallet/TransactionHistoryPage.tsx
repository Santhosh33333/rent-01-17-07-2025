import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface Transaction {
  id: number
  type: 'credit' | 'debit'
  amount: number
  description: string
  date: string
}

export function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get<Transaction[]>('/wallet/transactions')
        setTransactions(res.data)
      } catch (err) {
        setError('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <button onClick={() => setFilter('all')} className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}>All</button>
        <button onClick={() => setFilter('credit')} className={`btn ${filter === 'credit' ? 'btn-primary' : 'btn-secondary'}`}>Credits</button>
        <button onClick={() => setFilter('debit')} className={`btn ${filter === 'debit' ? 'btn-primary' : 'btn-secondary'}`}>Debits</button>
      </div>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(tx => (
              <tr key={tx.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{tx.type}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
