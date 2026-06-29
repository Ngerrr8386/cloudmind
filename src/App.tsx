import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, RequireAuth } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { LandingPage } from '@/pages/marketing/LandingPage'
import { PricingPage } from '@/pages/marketing/PricingPage'
import { PaymentResultPage } from '@/pages/marketing/PaymentResultPage'
import { AuthPage } from '@/pages/marketing/AuthPage'
import { DashboardPage } from '@/pages/app/DashboardPage'
import { FilesPage } from '@/pages/app/FilesPage'
import { SearchPage } from '@/pages/app/SearchPage'
import { ChatPage } from '@/pages/app/ChatPage'
import { SummariesPage } from '@/pages/app/SummariesPage'
import { InsightsPage } from '@/pages/app/InsightsPage'
import { SettingsPage } from '@/pages/app/SettingsPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Marketing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />

          {/* Kết quả thanh toán PayOS (returnUrl/cancelUrl) */}
          <Route path="/billing/success" element={<PaymentResultPage status="success" />} />
          <Route path="/billing/cancel" element={<PaymentResultPage status="cancel" />} />

          {/* App (yêu cầu đăng nhập) */}
          <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="summaries" element={<SummariesPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Đường dẫn lạ → về trang chủ (tránh màn hình trắng) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
