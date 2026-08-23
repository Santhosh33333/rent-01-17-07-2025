import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { AnimatedPage } from '../../components/AnimatedPage'

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
  const { register: registerUser, user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/profile/complete', { replace: true })
    }
  }, [user, navigate])

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
        fullName: data.name,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        dateOfBirth: '2000-01-01',
        gender: 'MALE',
      })
      toast.success('Registration successful!')
      navigate('/profile/complete', { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Registration failed. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4 py-12 transition-colors duration-400">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary-400/10 rounded-full blur-[128px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-accent-400/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative w-full max-w-md">
        <AnimatedPage>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-400 to-accent-500 shadow-xl shadow-primary-500/25 mb-5 animate-float">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                <path d="M12 3L20 9V20H14V13H10V20H4V9L12 3Z" fill="white" fillOpacity="0.93"/>
                <circle cx="9.5" cy="8.5" r="1.5" fill="#f97316" fillOpacity="0.9"/>
                <circle cx="14.5" cy="8.5" r="1.5" fill="#f97316" fillOpacity="0.9"/>
                <path d="M9.5 6.5Q12 4.5 14.5 6.5" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold font-display text-surface-900 dark:text-white tracking-tight">Create account</h1>
            <p className="mt-2 text-surface-500 dark:text-surface-400 text-sm">Join the RentBuddy community</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all duration-500 ${
                  step > s.id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : step === s.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-2 border-primary-400 dark:border-primary-500'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-10 h-0.5 rounded-full transition-colors duration-500 ${
                    step > s.id ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="glass-elevated p-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold font-display text-surface-900 dark:text-white">{steps[step - 1].title}</h3>
              <p className="text-sm text-surface-500 mt-1">{steps[step - 1].subtitle}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <label htmlFor="name" className="label">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                      <input {...register('name')} type="text" id="name" className="input pl-11" placeholder="John Doe" />
                    </div>
                    {errors.name && <p className="mt-2 text-xs text-danger-500 font-medium">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="label">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                      <input {...register('email')} type="email" id="email" className="input pl-11" placeholder="you@example.com" />
                    </div>
                    {errors.email && <p className="mt-2 text-xs text-danger-500 font-medium">{errors.email.message}</p>}
                  </div>
                  <button type="button" onClick={handleNext} className="btn-gradient w-full btn-lg group">
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
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                      <input {...register('phone')} type="tel" id="phone" className="input pl-11" placeholder="+91 98765 43210" />
                    </div>
                    {errors.phone && <p className="mt-2 text-xs text-danger-500 font-medium">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="password" className="label">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                      <input {...register('password')} type={showPassword ? 'text' : 'password'} id="password" className="input pl-11 pr-11" placeholder="Create a password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-2 text-xs text-danger-500 font-medium">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                      <input {...register('confirmPassword')} type="password" id="confirmPassword" className="input pl-11" placeholder="Confirm your password" />
                    </div>
                    {errors.confirmPassword && <p className="mt-2 text-xs text-danger-500 font-medium">{errors.confirmPassword.message}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
                      <ArrowLeft className="w-4 h-4" />
                      Back
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
                  <div className="glass-card-sm p-5 space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-surface-500">Name</span>
                      <span className="font-semibold text-surface-900 dark:text-white">{watch('name') || '—'}</span>
                    </div>
                    <div className="h-px bg-surface-200 dark:bg-surface-700" />
                    <div className="flex justify-between items-center">
                      <span className="text-surface-500">Email</span>
                      <span className="font-semibold text-surface-900 dark:text-white">{watch('email') || '—'}</span>
                    </div>
                    <div className="h-px bg-surface-200 dark:bg-surface-700" />
                    <div className="flex justify-between items-center">
                      <span className="text-surface-500">Phone</span>
                      <span className="font-semibold text-surface-900 dark:text-white">{watch('phone') || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <input
                      {...register('terms')}
                      type="checkbox"
                      id="terms"
                      className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="terms" className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                      I agree to the{' '}
                      <a href="#" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.terms && <p className="text-xs text-danger-500 font-medium">{errors.terms.message}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)} className="btn-outline flex-1">
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="btn-gradient flex-1 group">
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Create Account
                          <Sparkles className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-surface-500 dark:text-surface-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
              Sign in
            </Link>
          </p>
        </AnimatedPage>
      </div>
    </div>
  )
}
