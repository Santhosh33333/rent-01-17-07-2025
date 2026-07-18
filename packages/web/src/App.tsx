import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'

import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { VerifyMobilePage } from './pages/auth/VerifyMobilePage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { VerificationPage } from './pages/verification/VerificationPage'
import { VerifySelfiePage } from './pages/verification/VerifySelfiePage'
import { VerifyGovIdPage } from './pages/verification/VerifyGovIdPage'
import { VerifyAddressPage } from './pages/verification/VerifyAddressPage'
import { WalletPage } from './pages/wallet/WalletPage'
import { WithdrawalPage } from './pages/wallet/WithdrawalPage'
import { TransactionHistoryPage } from './pages/wallet/TransactionHistoryPage'
import { WalkingRequestsPage } from './pages/walking-requests/WalkingRequestsPage'
import { CreateWalkingRequestPage } from './pages/walking-requests/CreateWalkingRequestPage'
import { WalkingRequestDetailPage } from './pages/walking-requests/WalkingRequestDetailPage'
import { CommunitiesPage } from './pages/communities/CommunitiesPage'
import { CommunityDetailPage } from './pages/communities/CommunityDetailPage'
import { EventsPage } from './pages/events/EventsPage'
import { EventDetailPage } from './pages/events/EventDetailPage'
import { MessagesPage } from './pages/messages/MessagesPage'
import { ConversationPage } from './pages/messages/ConversationPage'
import { ApplyPage } from './pages/walking-partner/ApplyPage'
import { StatusPage } from './pages/walking-partner/StatusPage'
import { AdminPortalPage } from './pages/admin/AdminPortalPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminKycPage } from './pages/admin/AdminKycPage'
import { AdminWithdrawalsPage } from './pages/admin/AdminWithdrawalsPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage'
import { AdminWalkingPartnersPage } from './pages/admin/AdminWalkingPartnersPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-mobile" element={<VerifyMobilePage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
          <Route path="/verification/selfie" element={<ProtectedRoute><VerifySelfiePage /></ProtectedRoute>} />
          <Route path="/verification/gov-id" element={<ProtectedRoute><VerifyGovIdPage /></ProtectedRoute>} />
          <Route path="/verification/address" element={<ProtectedRoute><VerifyAddressPage /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/wallet/withdraw" element={<ProtectedRoute><WithdrawalPage /></ProtectedRoute>} />
          <Route path="/wallet/history" element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
          <Route path="/walking-requests" element={<ProtectedRoute><WalkingRequestsPage /></ProtectedRoute>} />
          <Route path="/walking-requests/create" element={<ProtectedRoute><CreateWalkingRequestPage /></ProtectedRoute>} />
          <Route path="/walking-requests/:id" element={<ProtectedRoute><WalkingRequestDetailPage /></ProtectedRoute>} />
          <Route path="/communities" element={<ProtectedRoute><CommunitiesPage /></ProtectedRoute>} />
          <Route path="/communities/:id" element={<ProtectedRoute><CommunityDetailPage /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:userId" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
          <Route path="/walking-partner/apply" element={<ProtectedRoute><ApplyPage /></ProtectedRoute>} />
          <Route path="/walking-partner/status" element={<ProtectedRoute><StatusPage /></ProtectedRoute>} />
          <Route path="/admin/portal" element={<ProtectedRoute><AdminPortalPage /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/kyc" element={<AdminRoute><AdminKycPage /></AdminRoute>} />
          <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawalsPage /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
          <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogsPage /></AdminRoute>} />
          <Route path="/admin/walking-partners" element={<AdminRoute><AdminWalkingPartnersPage /></AdminRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
