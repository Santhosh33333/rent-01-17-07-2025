import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Eye, MapPin, Lock, AlertTriangle, ChevronRight, Loader2, Ban, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { AnimatedPage } from '../../components/AnimatedPage'
import { GlassCard } from '../../components/GlassCard'
import { EmptyState } from '../../components/EmptyState'
import { api } from '../../lib/api'

interface BlockedUser {
  id: string
  blocked: { id: string; fullName: string; email: string; avatarUrl: string | null }
  createdAt: string
}

export function PrivacyPage() {
  const navigate = useNavigate()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get('/users/blocked').then(r => setBlockedUsers(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const unblock = async (id: string) => {
    try {
      await api.delete(`/users/block/${id}`)
      setBlockedUsers(prev => prev.filter(b => b.id !== id))
      toast.success('User unblocked')
    } catch { toast.error('Failed to unblock user') }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete('/users/account')
      localStorage.clear()
      toast.success('Account deleted')
      navigate('/login')
    } catch { toast.error('Failed to delete account') }
    finally { setDeleting(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm">Back</span>
      </button>

      <AnimatedPage>
        <GlassCard variant="elevated" padding="lg">
          <h1 className="text-2xl font-bold font-display text-surface-900 dark:text-white mb-2">Privacy & Safety</h1>
          <p className="text-sm text-surface-500 mb-6">Manage your privacy settings and safety preferences</p>

          <div className="space-y-1">
            <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center"><Eye className="w-5 h-5 text-blue-500" /></div>
                <div className="text-left"><p className="text-sm font-medium text-surface-900 dark:text-white">Profile Visibility</p><p className="text-xs text-surface-500">Control who can see your profile</p></div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500" />
            </button>

            <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-emerald-500" /></div>
                <div className="text-left"><p className="text-sm font-medium text-surface-900 dark:text-white">Location Sharing</p><p className="text-xs text-surface-500">Manage location sharing preferences</p></div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500" />
            </button>

            <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center"><Lock className="w-5 h-5 text-violet-500" /></div>
                <div className="text-left"><p className="text-sm font-medium text-surface-900 dark:text-white">Online Status</p><p className="text-xs text-surface-500">Show or hide your online status</p></div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500" />
            </button>
          </div>
        </GlassCard>
      </AnimatedPage>

      {/* Blocked Users */}
      <AnimatedPage delay={100}>
        <GlassCard variant="elevated" padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-danger-500" />
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Blocked Users</h2>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="animate-pulse h-16 bg-surface-100 dark:bg-surface-800 rounded-xl" />)}</div>
          ) : blockedUsers.length === 0 ? (
            <EmptyState icon={Users} title="No blocked users" description="You haven't blocked anyone" />
          ) : (
            <div className="space-y-2">
              {blockedUsers.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl avatar flex items-center justify-center text-sm font-bold">{b.blocked.fullName.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{b.blocked.fullName}</p>
                      <p className="text-xs text-surface-500">{b.blocked.email}</p>
                    </div>
                  </div>
                  <button onClick={() => unblock(b.id)} className="text-xs text-primary-500 hover:text-primary-600 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">Unblock</button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </AnimatedPage>

      {/* Danger Zone */}
      <AnimatedPage delay={200}>
        <GlassCard variant="elevated" padding="lg" className="border-2 border-danger-200 dark:border-danger-800/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-danger-500" />
            <h2 className="text-lg font-semibold text-danger-600 dark:text-danger-400">Danger Zone</h2>
          </div>
          <p className="text-sm text-surface-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-outline text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 border-danger-200 dark:border-danger-800/30">
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </GlassCard>
      </AnimatedPage>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-elevated p-6 rounded-3xl max-w-md w-full animate-scaleIn">
            <div className="w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-danger-500" />
            </div>
            <h3 className="text-xl font-bold font-display text-center text-surface-900 dark:text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-surface-500 text-center mb-6">This action cannot be undone. All your data will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={deleteAccount} disabled={deleting} className="btn-primary bg-danger-500 hover:bg-danger-600 flex-1">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
