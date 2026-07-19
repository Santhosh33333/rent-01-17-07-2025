import { useState, useEffect } from 'react'
import {
  Users,
  Calendar,
  MessageSquare,
  Wallet,
  Footprints,
  TrendingUp,
  ArrowRight,
  Shield,
  Sparkles,
  UserPlus,
  Compass,
  AlertTriangle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { api } from '../../lib/api'
import { StatCard } from '../../components/StatCard'
import { TrustScoreDisplay } from '../../components/TrustScoreDisplay'
import { VerificationBadge } from '../../components/VerificationBadge'

type VerificationStatus = 'verified' | 'pending' | 'not-started' | 'rejected' | 'expired'

interface DashboardData {
  profile: { trustScore: number; verificationStatus: string } | null
  wallet: { balance: number } | null
  conversations: { unreadCount: number } | null
  communities: { count: number } | null
  events: { count: number } | null
  walkingRequests: { count: number } | null
}

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>({
    wallet: null,
    communities: null,
    events: null,
    walkingRequests: null,
    profile: null,
    conversations: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [profileRes, walletRes, conversationsRes, communitiesRes, eventsRes, walkingRes] =
          await Promise.allSettled([
            api.get('/users/profile'),
            api.get('/wallet'),
            api.get('/messages/conversations'),
            api.get('/communities'),
            api.get('/events'),
            api.get('/walking-requests'),
          ])

        setData({
          profile: profileRes.status === 'fulfilled' ? profileRes.value.data : null,
          wallet: walletRes.status === 'fulfilled' ? walletRes.value.data : null,
          conversations:
            conversationsRes.status === 'fulfilled'
              ? { unreadCount: conversationsRes.value.data?.unreadCount ?? 0 }
              : null,
          communities:
            communitiesRes.status === 'fulfilled'
              ? { count: Array.isArray(communitiesRes.value.data) ? communitiesRes.value.data.length : communitiesRes.value.data?.count ?? 0 }
              : null,
          events:
            eventsRes.status === 'fulfilled'
              ? { count: Array.isArray(eventsRes.value.data) ? eventsRes.value.data.length : eventsRes.value.data?.count ?? 0 }
              : null,
          walkingRequests:
            walkingRequestsRes.status === 'fulfilled'
              ? { count: Array.isArray(walkingRequestsRes.value.data) ? walkingRequestsRes.value.data.length : walkingRequestsRes.value.data?.count ?? 0 }
              : null,
        })
      } catch {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const trustScore = data.profile?.trustScore ?? user?.trustScore ?? 0
  const walletBalance = data.wallet?.balance ?? 0
  const unreadMessages = data.conversations?.unreadCount ?? 0
  const communityCount = data.communities?.count ?? 0
  const eventCount = data.events?.count ?? 0
  const walkingRequestCount = data.walkingRequests?.count ?? 0

  const quickActions = [
    { to: '/walking-requests', icon: Footprints, label: 'Find Walks', gradient: 'success' as const },
    { to: '/walking-partner/apply', icon: UserPlus, label: 'Become Partner', gradient: 'accent' as const },
    { to: '/communities', icon: Users, label: 'Communities', gradient: 'info' as const },
    { to: '/events', icon: Calendar, label: 'Events', gradient: 'warning' as const },
    { to: '/wallet', icon: Wallet, label: 'Wallet', gradient: 'primary' as const },
    { to: '/profile', icon: Shield, label: 'Profile', gradient: 'accent' as const },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-48 rounded-lg" />
            <div className="skeleton h-4 w-32 mt-2 rounded-md" />
          </div>
          <div className="skeleton h-12 w-12 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="skeleton h-4 w-20 rounded-md" />
              <div className="skeleton h-8 w-16 mt-3 rounded-md" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 glass-card p-6">
            <div className="skeleton h-6 w-32 rounded-md" />
            <div className="space-y-4 mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="skeleton h-6 w-24 rounded-md" />
            <div className="space-y-3 mt-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state animate-fadeIn">
        <AlertTriangle className="w-16 h-16 text-red-400" />
        <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mt-4">
          Something went wrong
        </h3>
        <p className="text-surface-500 dark:text-surface-400 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Here's what's happening with your account
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TrustScoreDisplay score={trustScore} size="sm" />
          {data.profile?.verificationStatus && (
            <VerificationBadge
              status={data.profile.verificationStatus as VerificationStatus}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Trust Score"
          value={`${trustScore}/100`}
          icon={<Shield className="w-6 h-6" />}
          gradient="primary"
          change={trustScore >= 80 ? 'Excellent' : trustScore >= 60 ? 'Good' : 'Needs work'}
          changeType={trustScore >= 80 ? 'positive' : trustScore >= 60 ? 'neutral' : 'negative'}
        />
        <StatCard
          title="Wallet Balance"
          value={`₹${walletBalance.toLocaleString('en-IN')}`}
          icon={<Wallet className="w-6 h-6" />}
          gradient="accent"
        />
        <StatCard
          title="Unread Messages"
          value={unreadMessages}
          icon={<MessageSquare className="w-6 h-6" />}
          gradient="info"
          change={unreadMessages > 0 ? `${unreadMessages} new` : 'All caught up'}
          changeType={unreadMessages > 0 ? 'positive' : 'neutral'}
        />
        <StatCard
          title="Active Walks"
          value={walkingRequestCount}
          icon={<Footprints className="w-6 h-6" />}
          gradient="success"
          change={walkingRequestCount > 0 ? 'Active' : 'None active'}
          changeType={walkingRequestCount > 0 ? 'positive' : 'neutral'}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Communities"
          value={communityCount}
          icon={<Users className="w-6 h-6" />}
          gradient="warning"
        />
        <StatCard
          title="Events"
          value={eventCount}
          icon={<Calendar className="w-6 h-6" />}
          gradient="accent"
        />
        <StatCard
          title="Messages"
          value={unreadMessages}
          icon={<MessageSquare className="w-6 h-6" />}
          gradient="info"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              Recent Activity
            </h2>
            <Link
              to="/profile"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {walkingRequestCount === 0 && communityCount === 0 && eventCount === 0 ? (
            <div className="empty-state py-8">
              <Compass className="w-12 h-12 text-surface-400" />
              <h3 className="text-base font-medium text-surface-600 dark:text-surface-400 mt-3">
                No recent activity
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-500 mt-1">
                Start exploring to see activity here
              </p>
              <Link to="/walking-requests" className="btn-primary mt-4 text-sm">
                Explore Walking Requests
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {walkingRequestCount > 0 && (
                <Link
                  to="/walking-requests"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Footprints className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {walkingRequestCount} active walking request{walkingRequestCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                      View and manage your walking requests
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors" />
                </div>
              )}
              {communityCount > 0 && (
                <div
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {communityCount} communit{communityCount === 1 ? 'y' : 'ies'} joined
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                      Connect with like-minded people
                    </p>
                  </div>
                  <Link to="/communities">
                    <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors" />
                  </Link>
                </div>
              )}
              {eventCount > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {eventCount} upcoming event{eventCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                      Don't miss out on local events
                    </p>
                  </div>
                  <Link to="/events">
                    <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-500" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-all group"
              >
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br from-${action.color}-500/20 to-${action.color}-600/10 flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <action.icon className={`w-4.5 h-4.5 text-${action.color}-600 dark:text-${action.color}-400`} />
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300 flex-1">
                  {action.label}
                </span>
                <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}