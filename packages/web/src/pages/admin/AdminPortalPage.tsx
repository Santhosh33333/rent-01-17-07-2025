import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'

interface PasswordForm {
  password: string
}

export function AdminPortalPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>()

  const userStr = localStorage.getItem('user')
  let user: { email: string; role?: string } | null = null
  try { user = userStr ? JSON.parse(userStr) : null } catch { user = null }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const adminRoles = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "FINANCE"]
  if (!adminRoles.includes(user.role || "")) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: PasswordForm) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.post('/auth/verify-password', {
        email: user!.email,
        password: data.password,
      })
      const result = response.data
      if (!result.success) {
        setError(result.error || 'Invalid password')
        return
      }
      localStorage.setItem('adminToken', result.data.accessToken)
      toast.success('Admin access granted')
      navigate('/admin/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Re-enter your password to access admin features
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              {...register('password', { required: 'Password is required' })}
              type="password"
              className="input rounded-md"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Verifying...' : 'Continue'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
