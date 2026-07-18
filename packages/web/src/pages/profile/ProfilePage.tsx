import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../lib/auth'
import { Link } from 'react-router-dom'
import { VerificationBadge } from '../../components/VerificationBadge'
import { TrustScoreDisplay } from '../../components/TrustScoreDisplay'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  })

  const onSubmit = (data: any) => {
    updateUser(data)
    setEditing(false)
    toast.success('Profile updated successfully')
  }

  const adminRoles = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "FINANCE"]
  const isAdmin = user?.role && adminRoles.includes(user.role)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-primary">Edit Profile</button>
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input {...register('name')} disabled={!editing} className="input rounded-md" />
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email')} disabled={!editing} className="input rounded-md" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input {...register('phone')} disabled={!editing} className="input rounded-md" />
          </div>
          {editing && (
            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          )}
        </form>
      </div>

      {isAdmin && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Access</h3>
          <p className="text-sm text-gray-600 mb-4">You have administrative privileges. Access the admin portal below.</p>
          <Link to="/admin/portal" className="btn-primary">Admin Portal</Link>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Email</span>
            <VerificationBadge status={user?.email ? 'verified' : 'not-started'} />
          </div>
          <div className="flex justify-between items-center">
            <span>Mobile</span>
            <VerificationBadge status={user?.phone ? 'verified' : 'not-started'} />
          </div>
          <div className="flex justify-between items-center">
            <span>Government ID</span>
            <VerificationBadge status="not-started" />
          </div>
          <div className="flex justify-between items-center">
            <span>Address</span>
            <VerificationBadge status="not-started" />
          </div>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trust Score</h3>
        <TrustScoreDisplay score={user?.trustScore || 0} />
      </div>
    </div>
  )
}
