import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export function WithdrawalPage() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { amount: '', bankAccount: '', ifscCode: '' },
  })

  const onSubmit = async (_data: any) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    toast.success('Withdrawal request submitted successfully')
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Withdraw Funds</h2>
      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Amount</label>
            <input {...register('amount', { required: 'Amount is required', min: { value: 100, message: 'Minimum withdrawal is $100' } })} type="number" className="input rounded-md" />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="label">Bank Account Number</label>
            <input {...register('bankAccount', { required: 'Bank account is required' })} type="text" className="input rounded-md" />
            {errors.bankAccount && <p className="mt-1 text-sm text-red-600">{errors.bankAccount.message}</p>}
          </div>
          <div>
            <label className="label">IFSC Code</label>
            <input {...register('ifscCode', { required: 'IFSC code is required' })} type="text" className="input rounded-md" />
            {errors.ifscCode && <p className="mt-1 text-sm text-red-600">{errors.ifscCode.message}</p>}
          </div>
          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </button>
            <Link to="/wallet" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
