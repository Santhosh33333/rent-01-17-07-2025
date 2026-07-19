import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Eye, EyeOff, MapPin, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useAuth } from '../../lib/auth'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

const steps = [
  { id: 1, title: 'Personal Info', subtitle: 'Your name and email' },
  { id: 2, title: 'Security', subtitle: 'Phone & password' },
  { id: 3, title: 'Confirm', subtitle: 'Review & agree' },
]

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  const handleNext = async () => {
    let fields: (keyof RegisterForm)[] = []
    if (step === 1) fields = ['name', 'email']
    if (step === 2) fields = ['phone', 'password', 'confirmPassword']
    const valid = await trigger(fields)
    if (valid) setStep(step + 1)
  }

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true)
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      })
      toast.success('Registration successful!')
      navigate('/verify-email')
    } catch {
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4 py-12 transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/25 mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Create account</h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400">
            Join the RentBuddy community
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                step > s.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : step === s.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-2 border-primary-500'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
              }`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${
                  step > s.id ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{steps[step - 1].title}</h3>
            <p className="text-sm text-surface-500">{steps[step - 1].subtitle}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="name" className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input {...register('name')} type="text" id="name" className="input pl-10" placeholder="John Doe" />
                  </div>
                  {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="label">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input {...register('email')} type="email" id="email" className="input pl-10" placeholder="you@example.com" />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <button type="button" onClick={handleNext} className="btn-gradient w-full group">
                  <span className="flex items-center justify-center gap-2">
                    Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="phone" className="label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input {...register('phone')} type="tel" id="phone" className="input pl-10" placeholder="+1 (555) 000-0000" />
                  </div>
                  {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>}
                </div>
                <div>
                  <label htmlFor="password" className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} id="password" className="input pl-10 pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input {...register('confirmPassword')} type="password" id="confirmPassword" className="input pl-10" placeholder="••••••••" />
                  </div>
                  {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={handleNext} className="btn-gradient flex-1 group">
                    <span className="flex items-center justify-center gap-2">
                      Continue
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="glass-card-sm p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-surface-500">Name</span>
                    <span className="font-medium text-surface-900 dark:text-white">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500">Email</span>
                    <span className="font-medium text-surface-900 dark:text-white">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500">Phone</span>
                    <span className="font-medium text-surface-900 dark:text-white">—</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    {...register('terms')}
                    type="checkbox"
                    id="terms"
                    className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <label htmlFor="terms" className="text-sm text-surface-600 dark:text-surface-400">
                    I agree to the{' '}
                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a>
                  </label>
                </div>
                {errors.terms && <p className="text-xs text-red-500">{errors.terms.message}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn-outline flex-1">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button type="submit" disabled={loading} className="btn-gradient flex-1">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Creating...
                      </span>
                    ) : 'Create account'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
