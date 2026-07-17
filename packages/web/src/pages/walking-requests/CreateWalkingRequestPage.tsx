import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export function CreateWalkingRequestPage() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { type: 'walking', location: '', date: '', time: '', description: '', reward: '' },
  })

  const onSubmit = async (_data: any) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    toast.success('Walking request created successfully')
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Walking Request</h2>
      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Type</label>
            <select {...register('type')} className="input rounded-md">
              <option value="walking">Walking</option>
              <option value="companionship">Companionship</option>
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input {...register('location', { required: 'Location is required' })} className="input rounded-md" />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input {...register('date', { required: 'Date is required' })} type="date" className="input rounded-md" />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
            </div>
            <div>
              <label className="label">Time</label>
              <input {...register('time', { required: 'Time is required' })} type="time" className="input rounded-md" />
              {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Reward ($)</label>
            <input {...register('reward', { required: 'Reward is required', min: { value: 5, message: 'Minimum reward is $5' } })} type="number" className="input rounded-md" />
            {errors.reward && <p className="mt-1 text-sm text-red-600">{errors.reward.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={3} className="input rounded-md" />
          </div>
          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Request'}
            </button>
            <Link to="/walking-requests" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
