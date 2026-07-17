import { useState } from 'react'

const transactions = [
  { id: 1, type: 'credit', amount: 150.00, description: 'Walking request payment', date: '2025-01-15' },
  { id: 2, type: 'debit', amount: 50.00, description: 'Withdrawal', date: '2025-01-14' },
  { id: 3, type: 'credit', amount: 200.00, description: 'Community event reward', date: '2025-01-13' },
]

export function TransactionHistoryPage() {
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all')
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
