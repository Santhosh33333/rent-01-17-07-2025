import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../lib/api'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true)
      setApiError(null)
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      })
      const result = response.data
      if (!result.success) {
        setApiError(result.error || 'Invalid credentials')
        return
      }
      const { accessToken, refreshToken, user } = result.data
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      }))
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setApiError(err?.response?.data?.error || err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to RentBuddy
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                {...register('email')}
                type="email"
                className="input rounded-md"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="mt-4">
              <label htmlFor="password" className="label">Password</label>
              <input
                {...register('password')}
                type="password"
                className="input rounded-md"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
          </div>

          {apiError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
