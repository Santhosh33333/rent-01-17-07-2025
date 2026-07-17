import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export function ApplyPage() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { experience: '', availability: '', reason: '', references: '' },
  })

  const onSubmit = async (_data: any) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    toast.success('Application submitted successfully')
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Become a Walking Partner</h2>
      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Experience</label>
            <textarea {...register('experience', { required: 'Experience is required' })} rows={3} className="input rounded-md" placeholder="Describe your experience with pets or walking..." />
            {errors.experience && <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>}
          </div>
          <div>
            <label className="label">Availability</label>
            <select {...register('availability', { required: 'Availability is required' })} className="input rounded-md">
              <option value="">Select availability</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
              <option value="both">Both</option>
            </select>
            {errors.availability && <p className="mt-1 text-sm text-red-600">{errors.availability.message}</p>}
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea {...register('reason', { required: 'Reason is required' })} rows={3} className="input rounded-md" />
            {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
          </div>
          <div>
            <label className="label">References (optional)</label>
            <textarea {...register('references')} rows={2} className="input rounded-md" />
          </div>
          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <Link to="/dashboard" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
