import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, Heart, ChevronRight, Lock, Scale, Mail, Globe } from 'lucide-react'
import { AnimatedPage } from '../../components/AnimatedPage'
import { GlassCard } from '../../components/GlassCard'

const APP_VERSION = '1.0.0'
const BUILD_NUMBER = '2026.07.19'

export function AboutPage() {
  const navigate = useNavigate()

  const links = [
    { icon: FileText, label: 'Terms & Conditions', desc: 'Read our terms of service', action: () => navigate('/about/terms') },
    { icon: Shield, label: 'Privacy Policy', desc: 'How we protect your data', action: () => navigate('/about/privacy') },
    { icon: Lock, label: 'Data Safety', desc: 'How your data is collected and used', action: () => navigate('/about/data-safety') },
    { icon: Scale, label: 'Community Guidelines', desc: 'Rules for using RentBuddy', action: () => navigate('/about/community-guidelines') },
    { icon: Mail, label: 'Contact Us', desc: 'support@rentbuddy.app', action: () => window.location.href = 'mailto:support@rentbuddy.app' },
    { icon: Globe, label: 'Website', desc: 'www.rentbuddy.app', action: () => window.open('https://www.rentbuddy.app', '_blank') },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm">Back</span>
      </button>

      <AnimatedPage>
        <GlassCard variant="elevated" padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 via-primary-400 to-accent-500 flex items-center justify-center shadow-xl shadow-primary-500/30 mb-4">
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
              <path d="M12 3L20 9V20H14V13H10V20H4V9L12 3Z" fill="white" fillOpacity="0.93"/>
              <rect x="10" y="13" width="4" height="7" rx="0.5" fill="#6366f1" fillOpacity="0.7"/>
              <rect x="5.5" y="10" width="3.5" height="3" rx="0.5" fill="#818cf8" fillOpacity="0.5"/>
              <rect x="15" y="10" width="3.5" height="3" rx="0.5" fill="#818cf8" fillOpacity="0.5"/>
              <circle cx="9" cy="7.5" r="1.2" fill="#f97316" fillOpacity="0.9"/>
              <circle cx="15" cy="7.5" r="1.2" fill="#f97316" fillOpacity="0.9"/>
              <path d="M9 5.8Q12 4 15 5.8" stroke="white" strokeWidth="0.6" strokeOpacity="0.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-surface-900 dark:text-white">RentBuddy</h1>
          <p className="text-sm text-surface-500 mt-1">Trust-based social platform</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-surface-400">
            <span>Version {APP_VERSION}</span>
            <span className="w-1 h-1 rounded-full bg-surface-300" />
            <span>Build {BUILD_NUMBER}</span>
          </div>
        </GlassCard>
      </AnimatedPage>

      <AnimatedPage delay={100}>
        <GlassCard variant="elevated" padding="lg">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Legal & Policies</h2>
          <div className="space-y-1">
            {links.map(l => (
              <button key={l.label} onClick={l.action} className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <l.icon className="w-4 h-4 text-surface-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{l.label}</p>
                    <p className="text-xs text-surface-500">{l.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors" />
              </button>
            ))}
          </div>
        </GlassCard>
      </AnimatedPage>

      <AnimatedPage delay={200}>
        <GlassCard variant="elevated" padding="lg">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Open Source Licenses</h2>
          <div className="space-y-2 text-xs text-surface-500">
            <p>React, React Router, Tailwind CSS, Lucide Icons, Axios, Prisma, Express.js, and other open-source packages.</p>
          </div>
        </GlassCard>
      </AnimatedPage>

      <AnimatedPage delay={300}>
        <p className="text-center text-xs text-surface-400 py-4">
          Made with <Heart className="w-3 h-3 inline text-danger-500" /> in India
          <br />© 2026 RentBuddy. All rights reserved.
        </p>
      </AnimatedPage>
    </div>
  )
}
